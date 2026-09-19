# Integrar Jev (TypeSafe AI / System One)

Esta guía documenta cómo este proyecto usa **Jev**, el modelo de TypeSafe AI, y qué hay que entender antes de integrarlo. El patrón sirve fuera de las apuestas: lo específico del dominio es sólo el ejemplo.

Referencias oficiales: [anuncio de System One y Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) · [documentación](https://docs.typesafe.ai/) · [SDK de JavaScript](https://docs.typesafe.ai/sdk/javascript)

## Lo que hay que entender primero

Jev no es un LLM con el que se conversa. Es lo que TypeSafe AI llama un **System One Model**: responde **preguntas estructuradas sobre un estado que tú le das**, con tipos garantizados y probabilidades calibradas, en 70–500 ms.

La consecuencia práctica, y el error más fácil de cometer:

> **Jev no genera listas ni texto libre.** No le vas a pedir "armame un boleto de apuestas" y recibir un arreglo de selecciones.

Le das un estado y un conjunto de preguntas con nombre, y te devuelve una respuesta tipada por pregunta. Eso significa que el patrón de integración es:

**Jev toma la decisión de criterio. Tus datos ponen los hechos.**

En este proyecto: Jev clasifica *qué nivel de riesgo está pidiendo el usuario* a partir de su mensaje, y el código cruza esa clasificación con las cuotas reales del proveedor para armar el boleto. Jev nunca inventa un partido ni una cuota.

## Instalación y cliente

```bash
npm install @typesafe-ai/sdk    # requiere Node 20+
```

El cliente lee `TYPESAFE_API_KEY` del entorno:

```ts
import { TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient();
// Por defecto: baseURL https://api.typesafe.ai, modelo jev-latest,
// timeout 10s, 2 reintentos. Todo es configurable por constructor.
```

El constructor **lanza excepción si falta la API key**, así que conviene comprobarla antes de instanciar si quieres degradar en vez de romper:

```ts
function getClient(): TypeSafeClient | null {
  if (!process.env.TYPESAFE_API_KEY) return null;
  return new TypeSafeClient();
}
```

> Llama a Jev sólo desde el servidor (Route Handlers o Server Actions). El SDK tiene una opción `dangerouslyAllowBrowser`, y el nombre ya dice por qué no usarla: expone tu key.

## Los tres tipos de pregunta

`client.systemOne({ state, questions })` recibe el estado a evaluar (texto, objeto o arreglo JSON) y las preguntas indexadas por el nombre con el que quieres leer cada respuesta.

| Helper | Para qué | Qué devuelve |
| --- | --- | --- |
| `choice(instrucciones, criterios)` | Elegir entre alternativas con nombre | `{ choice, confidence, probabilities }` |
| `score(instrucciones, criterios)` | Puntuar con una rúbrica ordenada (mín. 2 niveles) | `{ score, confidence, legend, probabilities }` |
| `noul(instrucciones, criterios?)` | Sí/no | `{ noul }` — probabilidad de "sí", de 0 a 1 |

Los tipos de la respuesta se infieren de las preguntas: si los criterios de un `choice` son `Bajo | Medio | Alto`, `answers.x.choice` es exactamente esa unión, no `string`.

## Cómo lo usa este proyecto

En [`lib/jev/client.ts`](../lib/jev/client.ts):

```ts
const { answers } = await client.systemOne({
  state: { prompt },
  questions: {
    riskProfile: choice('Que nivel de riesgo de apuesta pide este mensaje del usuario?', {
      Bajo: 'Prefiere favoritos claros y cuotas bajas; poco riesgo.',
      Medio: 'Acepta cuotas moderadas; riesgo intermedio.',
      Alto: 'Busca cuotas altas o resultados sorpresa; riesgo alto.',
    }),
  },
});

answers.riskProfile.choice;      // 'Bajo' | 'Medio' | 'Alto'
answers.riskProfile.confidence;  // 0..1, calibrada
```

Y después, con datos propios:

```ts
const matches = await oddsProvider.getMatches();        // cuotas reales
const suggestedBets = pickMatchesForRisk(matches, riskProfile);
```

Tres cosas que vale la pena copiar de ahí:

1. **Los criterios son prompt.** La calidad de la clasificación depende de qué tan bien describes cada alternativa. Son descripciones, no etiquetas.
2. **La confianza es utilizable.** Viene calibrada, así que puedes mostrarla o usarla como umbral (`if (confidence < 0.6) pedir aclaración`).
3. **Valida igual en el borde.** El SDK garantiza los tipos de la respuesta, pero lo que sale de tu route handler hacia el cliente pasa por Zod ([`lib/jev/schemas.ts`](../lib/jev/schemas.ts)). Garantía del modelo y contrato de tu API son dos cosas distintas.

## Degradar sin la key

El acceso a Jev está en *early access*, así que el proyecto funciona sin él: si falta `TYPESAFE_API_KEY` o la llamada falla, [`app/api/jev/route.ts`](../app/api/jev/route.ts) cae a una respuesta simulada y lo dice en la respuesta:

```ts
try {
  const data = await jevClient.evaluate({ prompt });
  return { data, engine: 'Jev System One' };
} catch (error) {
  console.error('[jev] Fallo la evaluacion real, usando respuesta simulada:', error);
  return { data: simulateJevResponse(prompt), engine: 'Jev System One (simulado)' };
}
```

El campo `meta.engine` de la respuesta dice cuál de los dos contestó, y `meta.latencyMs` trae la latencia medida de verdad. Es el mismo patrón que usan el proveedor de cuotas y el caché en este repo: nunca romper por falta de credencial, y decir siempre en qué modo estás.

## Qué decidimos NO mandarle a Jev

El motor de Juego Responsable ([`scoreResponsibleGambling`](../lib/jev/client.ts)) **es una heurística local**, aunque el primitivo `score` de Jev le calzaría bien.

El motivo es deliberado: es una función de seguridad. Tiene que responder siempre, incluso sin credenciales, sin red o con el servicio caído — y tiene que ser auditable por cualquiera que lea el repositorio. Una detección de patrones de juego compulsivo que depende de una API externa deja de existir justo cuando la API no está.

Si integras Jev, vale la pena hacerse la misma pregunta: *¿qué pasa con esta función si la llamada falla?* Para lo que es criterio, Jev es excelente. Para lo que no puede dejar de funcionar, código propio.

## Errores

El SDK expone clases por tipo de fallo, que conviene distinguir al menos entre "problema de credenciales" y "problema transitorio":

```ts
import { AuthenticationError, RateLimitError, APITimeoutError } from '@typesafe-ai/sdk';
```

Los reintentos ya vienen de fábrica (2, con backoff y respeto de `Retry-After`), así que un `APITimeoutError` que llega hasta tu código ya agotó los reintentos.

## Adaptarlo a otro dominio

El patrón no tiene nada de apuestas:

1. Identifica **la decisión de criterio** que hoy resolverías con reglas frágiles o con un LLM lento ("¿este ticket es urgente?", "¿qué tono tiene este mensaje?", "¿qué tan completa está esta solicitud?").
2. Exprésala como `choice`, `score` o `noul`, con descripciones reales en los criterios.
3. Deja los hechos en tu base de datos o en tu API, y usa la respuesta de Jev para filtrar, ordenar o ramificar.
4. Degrada con gracia cuando no haya credencial.

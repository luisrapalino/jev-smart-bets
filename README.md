# Jev Smart Bets

Tablero de apuestas deportivas *open-source* sobre **Next.js (App Router)** que usa **[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)**, el modelo de TypeSafe AI, para interpretar pedidos en lenguaje natural y armar boletos con cuotas reales.

Es, hasta donde sabemos, una de las primeras implementaciones públicas del SDK de JavaScript de Jev. Si viniste por eso, la guía está en **[docs/integracion-jev.md](./docs/integracion-jev.md)**.

## Empezar (sin configurar nada)

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). **No hace falta ninguna credencial**: el proyecto arranca en modo demo con datos simulados y todas las funciones operativas, incluido el filtro de Juego Responsable. La cabecera muestra una etiqueta `demo` cuando estás en ese modo.

Para usar datos reales, copia `.env.example` a `.env.local` y completa lo que quieras activar. Cada integración degrada por separado: puedes tener cuotas reales sin base de datos, o al revés.

| Variable | Qué activa | Sin ella |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | Jev real ([early access](https://typesafe.ai)) | Respuesta simulada; `meta.engine` lo indica |
| `ODDS_API_KEY` | Cuotas reales de [The Odds API](https://the-odds-api.com) | Partidos simulados |
| `DATABASE_URL` | Persistencia en Postgres (Neon) | Historial en memoria del proceso |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Caché de cuotas compartido (Upstash Redis) | Caché en memoria del proceso |
| `AFFILIATE_ID_*` | Tu identificador de afiliado por operador | Enlaces a la home del operador, sin tag |

Con `DATABASE_URL` configurada, crea las tablas con `pnpm db:push` (y explóralas con `pnpm db:studio`).

## Qué SÍ hace

- Traduce lenguaje natural a selecciones mediante Jev, y muestra la latencia real del motor.
- Arma boletos con cuotas compuestas y ganancia estimada.
- Tablero de partidos con cuotas en vivo y movimiento de precio (Champions League, Premier League, La Liga).
- Aplica un filtro de Juego Responsable sobre la actividad reciente.
- Conecta de forma modular con casas de apuestas afiliadas.

## Identidad: sin cuentas obligatorias

No hace falta registrarse para usar el tablero. Cada navegador recibe un identificador anónimo en una cookie `httpOnly` ([`lib/session.ts`](./lib/session.ts)), y el historial y el filtro de Juego Responsable se calculan **contra esa sesión**, nunca contra el total del sitio.

Es deliberado: la app no custodia dinero ni datos personales — eso vive en el operador — y exigir cuenta para mirar cuotas no tendría sentido. El costo es que por defecto es identidad de dispositivo: al borrar cookies se empieza de cero.

Para el que quiera que el historial (y el track record de Jev) sobrevivan un cambio de dispositivo, hay login opcional por magic link ([`lib/auth/magic-link.ts`](./lib/auth/magic-link.ts)): un email, un link de un solo uso, sin contraseña. Al entrar por primera vez, la actividad de la sesión anónima que tenías se reasigna a la cuenta nueva en vez de perderse. Sin `DATABASE_URL` configurada esta función no tiene modo demo — a diferencia del resto de las integraciones, cuentas *son* persistencia, así que no hay nada que simular sin ella.

## Qué NO hace

- No custodia ni procesa dinero: la apuesta se completa en el sitio del operador.
- No garantiza resultados ni predicciones.
- No almacena datos bancarios.
- No muestra escudos de los equipos: no existe una fuente gratuita con licencia para uso comercial, así que las insignias se generan a partir del nombre.

## Stack

Next.js 16, TypeScript estricto, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query v5, Framer Motion, Drizzle ORM, Neon PostgreSQL, Upstash Redis.

## Arquitectura

Cada dependencia externa vive detrás de un adaptador que elige implementación real o simulada según haya credencial, y cae a la simulada si la llamada falla:

| Área | Adaptador | Implementaciones |
| --- | --- | --- |
| Motor de IA | [`lib/jev/client.ts`](./lib/jev/client.ts) | Jev real · simulada |
| Cuotas | [`lib/odds/adapter.ts`](./lib/odds/adapter.ts) | [The Odds API](./lib/odds/the-odds-api.ts) · [simulada](./lib/odds/simulated.ts) |
| Persistencia | [`lib/db/repository.ts`](./lib/db/repository.ts) | Postgres · memoria |
| Caché | [`lib/cache/kv.ts`](./lib/cache/kv.ts) | Upstash Redis · memoria |
| Afiliados | [`lib/affiliates/operators.ts`](./lib/affiliates/operators.ts) | Bet365 · Rushbet · Wplay |

Agregar un proveedor de cuotas o un operador afiliado es implementar la interfaz correspondiente; no hay que tocar la UI.

La especificación original está en [documento_de_especificaci_n_master.md](./documento_de_especificaci_n_master.md). El código se le adelantó en varios puntos (por ejemplo, la variable de Jev es `TYPESAFE_API_KEY`, no `JEV_API_KEY`); ante la duda, manda el código.

## Tests

```bash
pnpm test        # una corrida
pnpm test:watch  # en modo watch
```

Cubren la lógica que puede romperse en silencio: cuota de la combinada, el filtro de Juego Responsable, el mapeo de The Odds API (con `fetch` simulado) y el repositorio en memoria del modo demo. Corren sin credenciales, igual que en CI.

## Contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licencia

MIT. Consulta [LICENSE](./LICENSE).

## Juego responsable

Este software es una herramienta de consulta, no un consejo de apuestas. Apostar implica riesgo de pérdida de dinero y puede generar adicción. Si sientes que perdiste el control, busca ayuda profesional.

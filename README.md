# Jev Smart Bets

Asistente y framework de apuestas deportivas *open-source* construido con **Next.js (App Router)** que utiliza **Jev (TypeSafe AI / System One)** para interpretar solicitudes en lenguaje natural (<100 ms) y estructurar boletos de apuestas interactivos.

## Qué SÍ hace
- Traduce lenguaje natural a selecciones de apuestas mediante Jev.
- Genera boletos dinámicos (*betslips*) con cuotas compuestas y ganancias estimadas.
- Muestra un feed de partidos en vivo con cuotas actualizadas.
- Aplica un filtro de Juego Responsable basado en el primitivo `Score` de Jev.
- Se integra de forma modular con casas de apuestas afiliadas.

## Qué NO hace
- No custodia ni procesa dinero directamente.
- No garantiza resultados ni predicciones.
- No almacena datos bancarios sensibles.

## Stack Tecnológico
Next.js 15+, TypeScript estricto, shadcn/ui, Tailwind CSS v4, Framer Motion, Zustand, TanStack Query v5, Drizzle ORM, Neon PostgreSQL.

## Empezar

```bash
pnpm install
cp .env.example .env.local # configura DATABASE_URL, ODDS_API_KEY, JEV_API_KEY
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura del Proyecto

Consulta [documento_de_especificaci_n_master.md](./documento_de_especificaci_n_master.md) para la especificación completa de arquitectura, esquemas y convenciones.

## Contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licencia

MIT. Consulta [LICENSE](./LICENSE).

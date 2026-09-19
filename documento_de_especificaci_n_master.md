# Master Project Specification: Jev Smart Bets (Open Source AI Betting Assistant)

> **Document Version:** 1.0.0  
> **Target Audience:** Lead Developers, AI Coding Agents (Cursor, Claude Code, Windsurf)  
> **License:** MIT License  
> **Repository Type:** Open Source Web Application & Framework  

---

## 1. Visión del Proyecto y Propósito

### 1.1 ¿Qué es Jev Smart Bets?
**Jev Smart Bets** es un asistente y framework de apuestas deportivas *open-source* desarrollado sobre **Next.js (App Router)** que utiliza **Jev (TypeSafe AI / System One)** para interpretar solicitudes en lenguaje natural en milisegundos (<100 ms) y estructurar boletos de apuestas interactivos de alta velocidad.

El proyecto resuelve la complejidad y lentitud de las casas de apuestas tradicionales transformando entradas de texto o voz desestructuradas (ejemplo: *"Combinada de bajo riesgo para los partidos de Champions de hoy"*) en esquemas JSON tipados que arman boletos de apuesta (*betslips*) de forma instantánea.

### 1.2 Alcance del Software: Qué HACE y Qué NO HACE

#### Lo que SÍ hace la aplicación:
1. **Traducción de lenguaje natural a cuotas:** Procesa comandos de usuario mediante Jev e identifica partidos, mercados y multiplicadores exactos.
2. **Generación de boletos dinámicos (*Betslips*):** Agrupa selecciones, calcula cuotas compuestas (*parlays*) y estima ganancias según el *stake* (monto a apostar).
3. **Feed dinámico de partidos en vivo:** Presenta eventos deportivos, cuotas actualizadas (1, X, 2) e indicadores de tendencias.
4. **Filtro de Juego Responsable:** Aplica un motor de evaluación con el primitivo `Score` de Jev para detectar patrones de apuesta compulsivos o de alto riesgo y sugerir pausas.
5. **Arquitectura modular para afiliados:** Permite conectar mediante API los boletos generados hacia casas de apuestas reguladas (Bet365, Rushbet, Wplay, etc.).

#### Lo que NO hace la aplicación:
1. **NO custodia ni procesa dinero directamente:** No opera como casa de apuestas ni posee pasarelas de pago internas para saldos.
2. **NO garantiza resultados ni predicciones mágicas:** La IA optimiza el filtrado y estructurado de datos, pero el azar deportivo permanece intacto.
3. **NO almacena datos sensibles bancarios:** Toda interacción de dinero real ocurre en el sitio del operador final/afiliado.

---

## 2. Modelo de Negocio y Estrategia Open Source

1. **Software Educativo y Framework Base:** Al ser código abierto bajo licencia MIT, el repositorio sirve como plantilla y estándar para la comunidad de desarrolladores de proyectos iGaming e IA.
2. **Monetización por Afiliación:** Quien despliegue la aplicación (incluyendo el mantenedor principal) integra sus enlaces de afiliados en la confirmación del boleto, recibiendo comisiones por conversión hacia las casas de apuestas.
3. **Transparencia Auditada:** Al ser código abierto, la comunidad puede verificar la transparencia de los cálculos y algoritmos de recomendación de Jev.

---

## 3. Stack Tecnológico Completo

### 3.1 Frontend & Interfaz de Usuario
* **Framework Web:** `Next.js 15+` (App Router con Server Components y Server Actions).
* **Lenguaje:** `TypeScript` (configuración estricta `strict: true`).
* **Librería de Componentes:** `shadcn/ui` (basado en Radix UI primitives).
* **Estilos & CSS:** `Tailwind CSS v4`.
* **Animaciones & Transiciones:** `Framer Motion` (transiciones del boleto flotante, microinteracciones).
* **Iconografía:** `Lucide React`.

### 3.2 Estado Global y Caché de Datos
* **Estado del Boleto de Apuestas (*Betslip*):** `Zustand` con persistencia en `localStorage`.
* **Manejo de Peticiones y Caché de APIs:** `TanStack Query v5` (`React Query`).

### 3.3 Backend, IA y Persistencia
* **Motor Lógico / IA:** SDK de `Jev (TypeSafe AI)` invocado exclusivamente en **Next.js Server Actions / Route Handlers** (`/app/api/jev/route.ts`).
* **Base de Datos:** `Neon PostgreSQL Serverless` o `Supabase`.
* **ORM:** `Drizzle ORM` (ultra-ligero para funciones Edge/Serverless).
* **Proveedor de Cuotas Deportivas:** `The Odds API` / `Sportradar` (vía adaptador modular).
* **Hosting / Despliegue:** `Vercel` (con Vercel KV / Redis para caché de cuotas).

---

## 4. Arquitectura del Sistema

```
[ Cliente / Browser (Next.js Client Components) ]
            │
            ├─► Estado Local de Apuestas (Zustand Store)
            │
            ▼ (Server Action / API Route)
[ Next.js Backend / Server Side (Vercel) ]
            │
            ├───► [ Jev API (TypeSafe AI) ] ──► (Regresa JSON Schema Validado en <100ms)
            │
            ├───► [ Odds API / Redis Cache ] ─► (Inyecta Cuotas y Marcadores Reales)
            │
            ▼
[ Neon PostgreSQL (Drizzle ORM) ] ──► (Guarda historial de prompts y configuraciones)
```

---

## 5. Estructura de Directorios del Repositorio

```text
jev-smart-bets/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── WORKFLOWS/
│       └── ci.yml
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                  # Dashboard Principal (Feed + Prompt Bar)
│   │   └── layout.tsx                # Shell con Sidebar y Header
│   ├── api/
│   │   ├── jev/
│   │   │   └── route.ts              # Route Handler para solicitudes a Jev
│   │   └── odds/
│   │       └── route.ts              # Proxy con caché para Odds API
│   ├── globals.css                   # Tailwind v4 & Variables de Tema
│   └── layout.tsx                    # Root Layout + Providers
├── components/
│   ├── ui/                           # Componentes de shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── drawer.tsx
│   ├── ai-prompt-bar.tsx             # Barra de entrada en lenguaje natural
│   ├── match-card.tsx                # Tarjeta de partido y botones de cuotas
│   ├── match-feed.tsx                # Grilla de partidos en vivo y próximos
│   ├── betslip-drawer.tsx            # Boleto flotante con Framer Motion
│   └── ai-suggestions-feed.tsx       # Presets sugeridos por Jev
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Tablas de Drizzle ORM
│   │   └── index.ts                  # Conexión a Neon PostgreSQL
│   ├── jev/
│   │   ├── client.ts                 # Configuración del SDK de Jev
│   │   └── schemas.ts                # Esquemas Zod / TypeSafe JSON
│   ├── store/
│   │   └── use-betslip-store.ts      # Store global de Zustand
│   └── utils.ts                      # Funciones auxiliares de cn/formatting
├── public/
│   └── favicon.ico
├── .env.example
├── CONTRIBUTING.md                   # Guía para colaboradores Open Source
├── LICENSE                           # Licencia MIT
├── README.md                         # Documentación pública del repositorio
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 6. Esquemas de Datos y Código Base

### 6.1 Store Global del Boleto de Apuestas (`lib/store/use-betslip-store.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSelection {
  id: string;
  matchId: string;
  matchName: string;
  selection: string;
  market: string;
  odds: number;
}

interface BetslipState {
  selections: BetSelection[];
  stake: number;
  isOpen: boolean;
  addSelection: (item: BetSelection) => void;
  removeSelection: (id: string) => void;
  setSelections: (items: BetSelection[]) => void;
  setStake: (stake: number) => void;
  toggleOpen: () => void;
  clearSlip: () => void;
}

export const useBetslipStore = create<BetslipState>()(
  persist(
    (set) => ({
      selections: [],
      stake: 20,
      isOpen: false,
      addSelection: (item) =>
        set((state) => {
          const exists = state.selections.some((s) => s.id === item.id);
          if (exists) {
            return { selections: state.selections.filter((s) => s.id !== item.id) };
          }
          // Filter out other selections for the same match to avoid conflicts
          const filtered = state.selections.filter((s) => s.matchId !== item.matchId);
          return { selections: [...filtered, item], isOpen: true };
        }),
      removeSelection: (id) =>
        set((state) => ({
          selections: state.selections.filter((s) => s.id !== id),
        })),
      setSelections: (items) => set({ selections: items, isOpen: true }),
      setStake: (stake) => set({ stake }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      clearSlip: () => set({ selections: [] }),
    }),
    { name: 'jev-betslip-storage' }
  )
);
```

### 6.2 Integración con Jev Server Handler (`app/api/jev/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Zod Schema for Jev TypeSafe Output
const JevBetResponseSchema = z.object({
  queryIntent: z.string(),
  riskProfile: z.enum(['Bajo', 'Medio', 'Alto']),
  confidenceScore: z.number().min(0).max(100),
  suggestedBets: z.array(
    z.object({
      matchId: z.string(),
      matchName: z.string(),
      selection: z.string(),
      market: z.string(),
      odds: z.number(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt es requerido' }, { status: 400 });
    }

    // SIMULATED JEV ENGINE LATENCY & RESPONSE
    // Replace with official Jev SDK instance in production:
    // const jevResult = await jevClient.evaluate({ prompt, schema: JevBetResponseSchema });
    
    const simulatedResponse = {
      queryIntent: prompt,
      riskProfile: 'Bajo',
      confidenceScore: 92,
      suggestedBets: [
        {
          matchId: 'm1',
          matchName: 'Real Madrid vs Barcelona',
          selection: 'Real Madrid Gana',
          market: 'Resultado Final (1X2)',
          odds: 1.85,
        },
        {
          matchId: 'm3',
          matchName: 'Arsenal vs Chelsea',
          selection: 'Más de 1.5 Goles',
          market: 'Total de Goles',
          odds: 1.51,
        },
      ],
    };

    const validatedData = JevBetResponseSchema.parse(simulatedResponse);

    return NextResponse.json({
      success: true,
      data: validatedData,
      meta: {
        latencyMs: 84,
        engine: 'Jev System One',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando solicitud en Jev' }, { status: 500 });
  }
}
```

### 6.3 Esquema de Base de Datos Drizzle (`lib/db/schema.ts`)
```typescript
import { pgTable, text, timestamp, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const userPrompts = pgTable('user_prompts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  promptText: text('prompt_text').notNull(),
  riskProfile: text('risk_profile').notNull(),
  confidenceScore: integer('confidence_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const betHistory = pgTable('bet_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  totalOdds: doublePrecision('total_odds').notNull(),
  stake: doublePrecision('stake').notNull(),
  potentialPayout: doublePrecision('potential_payout').notNull(),
  status: text('status').default('PENDING').notNull(), // PENDING, WON, LOST
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 7. Configuración Open Source y Colaboración

### 7.1 Licencia MIT (`LICENSE`)
```text
MIT License

Copyright (c) 2026 Jev Smart Bets Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 7.2 Guía de Contribución (`CONTRIBUTING.md`)
```markdown
# Guía de Contribución a Jev Smart Bets

¡Gracias por tu interés en contribuir a Jev Smart Bets! Sigue estos pasos para comenzar:

## Flujo de Trabajo
1. haz un **Fork** de este repositorio.
2. Crea una rama para tu feature o fix (`git checkout -b feature/nueva-funcionalidad`).
3. Asegúrate de cumplir con los estándares de TypeScript estricto y ejecutar `pnpm lint`.
4. Haz **Commit** de tus cambios (`git commit -m 'feat: agrega nuevo conector de cuotas'`).
5. Haz **Push** a la rama (`git push origin feature/nueva-funcionalidad`).
6. Abre un **Pull Request**.

## Estándares de Código
- Usar componentes funcionales en React y Server Actions para lógica de backend.
- Mantener compatibilidad con Tailwind CSS v4 y shadcn/ui.
- Documentar nuevos conectores de APIs deportivas en `/lib/odds/`.
```

---

## 8. Instrucciones de Prompt para Agentes de IA (Cursor / Claude Code)

Cuando importes este repositorio en Cursor o Claude Code, utiliza la siguiente instrucción inicial:

```text
Lee atentamente el archivo PROJECT_SPECIFICATION.md. Tu objetivo es construir paso a paso la aplicación web 'Jev Smart Bets' utilizando Next.js App Router, Tailwind CSS v4, shadcn/ui, Zustand y Drizzle ORM. Sigue la estructura de carpetas definida, mantén TypeScript en modo estricto y asegúrate de que la integración con la API de Jev simule respuestas estructuradas en menos de 100 ms.
```
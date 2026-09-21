import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/** Una seleccion tal como quedo registrada al confirmar la apuesta. */
export interface StoredSelection {
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  // De donde salio la seleccion: una sugerencia de Jev o el tablero
  // elegido a mano. Ausente en apuestas guardadas antes de este campo.
  // Sin esto no hay forma de medir si las sugerencias de Jev funcionan.
  source?: 'jev' | 'board';
}

// `session_id` es la identidad anonima por dispositivo (ver lib/session.ts).
// Todas las consultas filtran por ella: sin eso, el historial seria global
// y el filtro de Juego Responsable sumaria la actividad de todos.
export const userPrompts = pgTable(
  'user_prompts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text('session_id').notNull(),
    promptText: text('prompt_text').notNull(),
    riskProfile: text('risk_profile').notNull(),
    confidenceScore: integer('confidence_score').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('user_prompts_session_idx').on(table.sessionId, table.createdAt)]
);

export const betHistory = pgTable(
  'bet_history',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text('session_id').notNull(),
    totalOdds: doublePrecision('total_odds').notNull(),
    stake: doublePrecision('stake').notNull(),
    potentialPayout: doublePrecision('potential_payout').notNull(),
    status: text('status').default('PENDING').notNull(), // PENDING, WON, LOST
    operatorId: text('operator_id'), // casa de apuestas afiliada elegida (ver lib/affiliates)
    // Se guardan las selecciones con la cuota del momento: la cuota del
    // feed cambia, y el historial tiene que reflejar lo que se apostó.
    selections: jsonb('selections').$type<StoredSelection[]>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('bet_history_session_idx').on(table.sessionId, table.createdAt)]
);

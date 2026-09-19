import { pgTable, text, timestamp, doublePrecision, integer, jsonb } from 'drizzle-orm/pg-core';

/** Una seleccion tal como quedo registrada al confirmar la apuesta. */
export interface StoredSelection {
  matchName: string;
  market: string;
  selection: string;
  odds: number;
}

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
  operatorId: text('operator_id'), // casa de apuestas afiliada elegida (ver lib/affiliates)
  // Se guardan las selecciones con la cuota del momento: la cuota del
  // feed cambia, y el historial tiene que reflejar lo que se apostó.
  selections: jsonb('selections').$type<StoredSelection[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

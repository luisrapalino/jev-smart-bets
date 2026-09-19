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

import { count, desc, eq, gte, ne, sum } from 'drizzle-orm';

import { db, isDatabaseEnabled } from './index';
import { betHistory, userPrompts } from './schema';

export type BetStatus = 'PENDING' | 'WON' | 'LOST';

export interface SavedBet {
  id: string;
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: string;
  operatorId: string | null;
  createdAt: Date;
}

export interface SavePromptInput {
  promptText: string;
  riskProfile: string;
  confidenceScore: number;
}

export interface SaveBetInput {
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  operatorId: string;
}

/**
 * Acceso a la actividad del usuario (prompts evaluados y apuestas).
 * Existe para que la persistencia sea intercambiable: con Postgres
 * configurado guarda de verdad, y sin credenciales cae a memoria para
 * que el modo demo conserve todas las funciones -- incluido el filtro
 * de Juego Responsable, que necesita leer la actividad reciente.
 */
export interface BetsRepository {
  savePrompt(input: SavePromptInput): Promise<void>;
  saveBet(input: SaveBetInput): Promise<SavedBet>;
  settleBet(id: string, status: BetStatus): Promise<SavedBet | null>;
  countPromptsSince(since: Date): Promise<number>;
  sumStakeSince(since: Date): Promise<number>;
  recentSettledStatuses(limit: number): Promise<string[]>;
}

const postgresRepository: BetsRepository = {
  async savePrompt(input) {
    await db!.insert(userPrompts).values(input);
  },

  async saveBet(input) {
    const [bet] = await db!.insert(betHistory).values(input).returning();
    return bet;
  },

  async settleBet(id, status) {
    const [bet] = await db!
      .update(betHistory)
      .set({ status })
      .where(eq(betHistory.id, id))
      .returning();
    return bet ?? null;
  },

  async countPromptsSince(since) {
    const [row] = await db!
      .select({ value: count() })
      .from(userPrompts)
      .where(gte(userPrompts.createdAt, since));
    return row?.value ?? 0;
  },

  async sumStakeSince(since) {
    const [row] = await db!
      .select({ value: sum(betHistory.stake) })
      .from(betHistory)
      .where(gte(betHistory.createdAt, since));
    return Number(row?.value ?? 0);
  },

  async recentSettledStatuses(limit) {
    const rows = await db!
      .select({ status: betHistory.status })
      .from(betHistory)
      .where(ne(betHistory.status, 'PENDING'))
      .orderBy(desc(betHistory.createdAt))
      .limit(limit);
    return rows.map((row) => row.status);
  },
};

// Modo demo: vive en el proceso, asi que se reinicia con el servidor.
// Es suficiente para probar el flujo completo sin credenciales.
const prompts: { createdAt: Date }[] = [];
const bets: SavedBet[] = [];

const memoryRepository: BetsRepository = {
  async savePrompt() {
    prompts.push({ createdAt: new Date() });
  },

  async saveBet(input) {
    const bet: SavedBet = {
      id: crypto.randomUUID(),
      ...input,
      status: 'PENDING',
      createdAt: new Date(),
    };
    bets.push(bet);
    return bet;
  },

  async settleBet(id, status) {
    const bet = bets.find((b) => b.id === id);
    if (!bet) return null;
    bet.status = status;
    return bet;
  },

  async countPromptsSince(since) {
    return prompts.filter((p) => p.createdAt >= since).length;
  },

  async sumStakeSince(since) {
    return bets
      .filter((b) => b.createdAt >= since)
      .reduce((total, b) => total + b.stake, 0);
  },

  async recentSettledStatuses(limit) {
    return bets
      .filter((b) => b.status !== 'PENDING')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((b) => b.status);
  },
};

export const betsRepository: BetsRepository = isDatabaseEnabled
  ? postgresRepository
  : memoryRepository;

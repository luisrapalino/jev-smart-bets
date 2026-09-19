import { and, count, desc, eq, gte, ne, sum } from 'drizzle-orm';

import { db, isDatabaseEnabled } from './index';
import { betHistory, userPrompts, type StoredSelection } from './schema';

export type BetStatus = 'PENDING' | 'WON' | 'LOST';

export interface SavedBet {
  id: string;
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: string;
  operatorId: string | null;
  selections: StoredSelection[] | null;
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
  selections: StoredSelection[];
}

/**
 * Actividad de UNA sesion (ver lib/session.ts). Se obtiene siempre con
 * `betsFor(sessionId)` y no hay manera de consultar sin alcance: el
 * historial es privado por dispositivo, y el filtro de Juego Responsable
 * tiene que medir a una persona, no al trafico entero del sitio.
 */
export interface BetsRepository {
  savePrompt(input: SavePromptInput): Promise<void>;
  saveBet(input: SaveBetInput): Promise<SavedBet>;
  settleBet(id: string, status: BetStatus): Promise<SavedBet | null>;
  countPromptsSince(since: Date): Promise<number>;
  sumStakeSince(since: Date): Promise<number>;
  recentSettledStatuses(limit: number): Promise<string[]>;
  listBets(limit: number): Promise<SavedBet[]>;
}

function postgresRepository(sessionId: string): BetsRepository {
  const mine = eq(betHistory.sessionId, sessionId);

  return {
    async savePrompt(input) {
      await db!.insert(userPrompts).values({ ...input, sessionId });
    },

    async saveBet(input) {
      const [bet] = await db!
        .insert(betHistory)
        .values({ ...input, sessionId })
        .returning();
      return bet;
    },

    async settleBet(id, status) {
      // El `and` con la sesion es lo que impide liquidar la apuesta de otro.
      const [bet] = await db!
        .update(betHistory)
        .set({ status })
        .where(and(eq(betHistory.id, id), mine))
        .returning();
      return bet ?? null;
    },

    async countPromptsSince(since) {
      const [row] = await db!
        .select({ value: count() })
        .from(userPrompts)
        .where(and(eq(userPrompts.sessionId, sessionId), gte(userPrompts.createdAt, since)));
      return row?.value ?? 0;
    },

    async sumStakeSince(since) {
      const [row] = await db!
        .select({ value: sum(betHistory.stake) })
        .from(betHistory)
        .where(and(mine, gte(betHistory.createdAt, since)));
      return Number(row?.value ?? 0);
    },

    async recentSettledStatuses(limit) {
      const rows = await db!
        .select({ status: betHistory.status })
        .from(betHistory)
        .where(and(mine, ne(betHistory.status, 'PENDING')))
        .orderBy(desc(betHistory.createdAt))
        .limit(limit);
      return rows.map((row) => row.status);
    },

    async listBets(limit) {
      return db!
        .select()
        .from(betHistory)
        .where(mine)
        .orderBy(desc(betHistory.createdAt))
        .limit(limit);
    },
  };
}

// Modo demo: vive en el proceso, asi que se reinicia con el servidor.
// Es suficiente para probar el flujo completo sin credenciales.
const prompts: { sessionId: string; createdAt: Date }[] = [];
const bets: (SavedBet & { sessionId: string })[] = [];

/**
 * Dos apuestas seguidas pueden caer en el mismo milisegundo, y entonces
 * `createdAt` no alcanza para ordenar. Como el arreglo esta en orden de
 * insercion, invertirlo antes del sort (que es estable) hace que el
 * empate lo gane la ultima registrada.
 */
function newestFirst<T extends { createdAt: Date }>(list: T[]): T[] {
  return [...list].reverse().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function memoryRepository(sessionId: string): BetsRepository {
  const mine = () => bets.filter((b) => b.sessionId === sessionId);

  return {
    async savePrompt() {
      prompts.push({ sessionId, createdAt: new Date() });
    },

    async saveBet(input) {
      const bet = {
        id: crypto.randomUUID(),
        sessionId,
        ...input,
        status: 'PENDING',
        createdAt: new Date(),
      };
      bets.push(bet);
      return bet;
    },

    async settleBet(id, status) {
      const bet = mine().find((b) => b.id === id);
      if (!bet) return null;
      bet.status = status;
      return bet;
    },

    async countPromptsSince(since) {
      return prompts.filter((p) => p.sessionId === sessionId && p.createdAt >= since).length;
    },

    async sumStakeSince(since) {
      return mine()
        .filter((b) => b.createdAt >= since)
        .reduce((total, b) => total + b.stake, 0);
    },

    async recentSettledStatuses(limit) {
      return newestFirst(mine().filter((b) => b.status !== 'PENDING'))
        .slice(0, limit)
        .map((b) => b.status);
    },

    async listBets(limit) {
      return newestFirst(mine()).slice(0, limit);
    },
  };
}

/** Repositorio acotado a una sesion. Es el unico acceso a la actividad. */
export function betsFor(sessionId: string): BetsRepository {
  return isDatabaseEnabled ? postgresRepository(sessionId) : memoryRepository(sessionId);
}

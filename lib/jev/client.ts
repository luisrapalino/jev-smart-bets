import type { JevBetResponse } from './schemas';

/**
 * Configuracion del SDK de Jev (TypeSafe AI / System One).
 *
 * En produccion, reemplaza este stub por el cliente oficial:
 *   import { Jev } from '@jev-ai/sdk';
 *   export const jevClient = new Jev({ apiKey: process.env.JEV_API_KEY });
 *
 * El cliente real expone `jevClient.evaluate({ prompt, schema })`, que
 * invoca el motor System One y valida la respuesta contra un esquema Zod
 * en menos de 100ms.
 */
export interface JevEvaluateParams {
  prompt: string;
}

export interface JevClient {
  evaluate(params: JevEvaluateParams): Promise<JevBetResponse>;
  score(input: RiskEvaluationInput): Promise<RiskScoreResult>;
}

export interface RiskEvaluationInput {
  promptsLastHour: number;
  totalStakeLastHour: number;
  consecutiveLosses: number;
}

export interface RiskScoreResult {
  score: number; // 0 (seguro) - 100 (riesgo critico)
  flagged: boolean;
  reason?: string;
}

/**
 * Motor de evaluacion de Juego Responsable basado en el primitivo `Score`
 * de Jev. Detecta patrones de apuesta compulsivos o de alto riesgo.
 */
function scoreResponsibleGambling(input: RiskEvaluationInput): RiskScoreResult {
  const { promptsLastHour, totalStakeLastHour, consecutiveLosses } = input;

  let score = 0;
  score += Math.min(promptsLastHour * 5, 40);
  score += Math.min(totalStakeLastHour / 10, 30);
  score += Math.min(consecutiveLosses * 8, 30);
  score = Math.min(Math.round(score), 100);

  const flagged = score >= 70;

  return {
    score,
    flagged,
    reason: flagged
      ? 'Patron de apuestas de alto riesgo detectado. Se sugiere una pausa.'
      : undefined,
  };
}

export const jevClient: JevClient = {
  async evaluate() {
    throw new Error(
      'jevClient.evaluate no esta implementado. Usa la simulacion en app/api/jev/route.ts o conecta el SDK oficial de Jev.'
    );
  },
  async score(input) {
    return scoreResponsibleGambling(input);
  },
};

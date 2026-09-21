import { TypeSafeClient, choice } from '@typesafe-ai/sdk';

import { oddsProvider } from '../odds/adapter';
import type { Match } from '../odds/types';
import { isValueBet } from '../odds/value';
import type { JevBetResponse, RiskProfile } from './schemas';

/**
 * Cliente real de Jev (TypeSafe AI / System One).
 * https://docs.typesafe.ai/sdk/javascript
 *
 * Se activa cuando TYPESAFE_API_KEY esta configurada. `evaluate()` usa
 * una pregunta `choice` para clasificar el perfil de riesgo pedido en el
 * prompt, y arma el betslip cruzando esa clasificacion con las cuotas
 * reales de lib/odds/adapter.ts (Jev no genera listas arbitrarias; solo
 * responde preguntas estructuradas sobre un estado dado).
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
 * Motor de evaluacion de Juego Responsable inspirado en el primitivo
 * `Score` de Jev (rubrica ordenada). Se implementa como heuristica local
 * en vez de una llamada a la API porque es una funcion de seguridad que
 * debe responder siempre, incluso sin credenciales o si el servicio esta
 * caido.
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

const RISK_ODDS_RANGE: Record<RiskProfile, [number, number]> = {
  Bajo: [1, 1.9],
  Medio: [1.9, 3],
  Alto: [3, Infinity],
};

function getTypeSafeClient(): TypeSafeClient | null {
  if (!process.env.TYPESAFE_API_KEY) return null;
  return new TypeSafeClient();
}

async function classifyRiskProfile(
  client: TypeSafeClient,
  prompt: string
): Promise<{ riskProfile: RiskProfile; confidence: number }> {
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

  return {
    riskProfile: answers.riskProfile.choice as RiskProfile,
    confidence: answers.riskProfile.confidence,
  };
}

// Para "Bajo"/"Medio" el favorito suele caer solo en el rango: respaldar
// al favorito ES la apuesta segura. Para "Alto" exigir que el FAVORITO
// tenga cuota >=3 casi nunca ocurre (el margen de la casa hace que sea
// matematicamente raro que las tres cuotas de un 1X2 esten ahi a la vez),
// asi que se busca cualquier seleccion del partido -favorita o no- que
// caiga en el rango de riesgo pedido.
export function pickMatchesForRisk(matches: Match[], riskProfile: RiskProfile, count = 2) {
  const [min, max] = RISK_ODDS_RANGE[riskProfile];

  return matches
    .filter((match) => !match.isLive)
    .map((match) => {
      const inRange = match.market1x2.filter((o) => o.odds >= min && o.odds < max);
      if (inRange.length === 0) return null;
      // Entre las que cumplen el riesgo pedido, se prefiere la de mejor
      // valor detectado (lib/odds/value.ts) en vez de la mas barata sin
      // mas: dentro del mismo perfil de riesgo, una con edge paga mas
      // por probabilidad real similar. Sin dato de edge se cae a la
      // cuota mas baja, la eleccion "segura" de antes.
      const pick = inRange.reduce((best, candidate) => {
        const bestEdge = best.edgePct ?? -Infinity;
        const candidateEdge = candidate.edgePct ?? -Infinity;
        if (candidateEdge !== bestEdge) return candidateEdge > bestEdge ? candidate : best;
        return candidate.odds < best.odds ? candidate : best;
      });
      return { match, pick };
    })
    .filter((entry): entry is { match: Match; pick: Match['market1x2'][number] } => entry !== null)
    .sort((a, b) => {
      const aIsValue = isValueBet(a.pick.edgePct);
      const bIsValue = isValueBet(b.pick.edgePct);
      if (aIsValue !== bIsValue) return aIsValue ? -1 : 1;
      if (aIsValue) return (b.pick.edgePct ?? 0) - (a.pick.edgePct ?? 0);
      return a.pick.odds - b.pick.odds;
    })
    .slice(0, count)
    .map(({ match, pick }) => ({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      selection: pick.label === '1' ? match.homeTeam : pick.label === '2' ? match.awayTeam : 'Empate',
      market: 'Resultado Final (1X2)',
      odds: pick.odds,
      edgePct: pick.edgePct,
    }));
}

export const jevClient: JevClient = {
  async evaluate({ prompt }) {
    const client = getTypeSafeClient();
    if (!client) {
      throw new Error('TYPESAFE_API_KEY no esta configurada');
    }

    const [{ riskProfile, confidence }, matches] = await Promise.all([
      classifyRiskProfile(client, prompt),
      oddsProvider.getMatches(),
    ]);

    return {
      queryIntent: prompt,
      riskProfile,
      confidenceScore: Math.round(confidence * 100),
      suggestedBets: pickMatchesForRisk(matches, riskProfile),
    };
  },
  async score(input) {
    return scoreResponsibleGambling(input);
  },
};

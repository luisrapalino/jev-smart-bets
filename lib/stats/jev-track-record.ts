import type { SavedBet } from '@/lib/db/repository';

/**
 * Desempeño historico de las sugerencias de Jev, medido en unidades (1
 * unidad por pick, no el stake real): asi el resultado no depende de
 * cuanto aposto cada vez, que es como se miden los tipsters en serio.
 * Solo cuenta apuestas liquidadas donde TODAS las selecciones vinieron
 * de una sugerencia de Jev -si se mezcla con una elegida a mano en el
 * tablero, no hay forma de saber a cual atribuirle el resultado, asi que
 * se excluye en vez de adivinar.
 */
export interface JevTrackRecord {
  settled: number;
  won: number;
  lost: number;
  winRatePct: number;
  unitsProfit: number;
}

export function computeJevTrackRecord(bets: SavedBet[]): JevTrackRecord | null {
  const jevOnly = bets.filter(
    (bet) =>
      bet.status !== 'PENDING' &&
      (bet.selections?.length ?? 0) > 0 &&
      bet.selections!.every((s) => s.source === 'jev')
  );

  if (jevOnly.length === 0) return null;

  let won = 0;
  let unitsProfit = 0;

  for (const bet of jevOnly) {
    if (bet.status === 'WON') {
      won += 1;
      unitsProfit += bet.totalOdds - 1;
    } else {
      unitsProfit -= 1;
    }
  }

  const settled = jevOnly.length;
  return {
    settled,
    won,
    lost: settled - won,
    winRatePct: (won / settled) * 100,
    unitsProfit,
  };
}

import { describe, expect, it } from 'vitest';

import { computeJevTrackRecord } from '@/lib/stats/jev-track-record';
import type { SavedBet } from '@/lib/db/repository';

function bet(overrides: Partial<SavedBet>): SavedBet {
  return {
    id: crypto.randomUUID(),
    totalOdds: 2,
    stake: 20,
    potentialPayout: 40,
    status: 'PENDING',
    operatorId: 'bet365',
    selections: [{ matchName: 'A vs B', market: '1X2', selection: 'A', odds: 2, source: 'jev' }],
    createdAt: new Date(),
    ...overrides,
  };
}

describe('computeJevTrackRecord', () => {
  it('devuelve null sin apuestas liquidadas', () => {
    expect(computeJevTrackRecord([bet({ status: 'PENDING' })])).toBeNull();
  });

  it('ignora apuestas mezcladas con selecciones elegidas a mano: no hay a quien atribuirle el resultado', () => {
    const mixta = bet({
      status: 'WON',
      selections: [
        { matchName: 'A vs B', market: '1X2', selection: 'A', odds: 2, source: 'jev' },
        { matchName: 'C vs D', market: '1X2', selection: 'C', odds: 1.5, source: 'board' },
      ],
    });
    expect(computeJevTrackRecord([mixta])).toBeNull();
  });

  it('ignora selecciones de antes de que existiera el campo source', () => {
    const vieja = bet({
      status: 'WON',
      selections: [{ matchName: 'A vs B', market: '1X2', selection: 'A', odds: 2 }],
    });
    expect(computeJevTrackRecord([vieja])).toBeNull();
  });

  it('calcula win rate y unidades sobre apuestas 100% de Jev', () => {
    const ganada = bet({ status: 'WON', totalOdds: 2.5 });
    const perdida = bet({ status: 'LOST', totalOdds: 3 });
    const pendiente = bet({ status: 'PENDING' });

    const record = computeJevTrackRecord([ganada, perdida, pendiente]);

    expect(record).not.toBeNull();
    expect(record!.settled).toBe(2);
    expect(record!.won).toBe(1);
    expect(record!.lost).toBe(1);
    expect(record!.winRatePct).toBe(50);
    // +1.5u de la ganada (cuota 2.5 - 1 stake) - 1u de la perdida
    expect(record!.unitsProfit).toBeCloseTo(0.5, 10);
  });

  it('la ganancia en unidades no depende del stake real apostado', () => {
    const stakeChico = bet({ status: 'WON', totalOdds: 2, stake: 5 });
    const stakeGrande = bet({ status: 'WON', totalOdds: 2, stake: 500 });

    const r1 = computeJevTrackRecord([stakeChico]);
    const r2 = computeJevTrackRecord([stakeGrande]);

    expect(r1!.unitsProfit).toBe(r2!.unitsProfit);
  });
});

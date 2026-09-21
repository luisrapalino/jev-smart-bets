import { describe, expect, it } from 'vitest';

import { pickMatchesForRisk } from '@/lib/jev/client';
import type { Match, OddsSelection } from '@/lib/odds/types';

function match(
  id: string,
  homeTeam: string,
  awayTeam: string,
  market1x2: OddsSelection[]
): Match {
  return {
    id,
    league: 'Test League',
    homeTeam,
    awayTeam,
    startTime: new Date(Date.now() + 3_600_000).toISOString(),
    isLive: false,
    market1x2,
    trend: 'stable',
  };
}

describe('pickMatchesForRisk', () => {
  it('sin datos de edge, elige la cuota mas baja dentro del rango (comportamiento seguro)', () => {
    const matches = [
      match('m1', 'A', 'B', [
        { label: '1', odds: 2.5 },
        { label: 'X', odds: 3.2 },
        { label: '2', odds: 2.8 },
      ]),
    ];

    const [pick] = pickMatchesForRisk(matches, 'Medio', 1);
    expect(pick.odds).toBe(2.5);
  });

  it('dentro del mismo partido, prefiere la seleccion con mejor edge sobre la mas barata', () => {
    const matches = [
      match('m1', 'A', 'B', [
        { label: '1', odds: 2.1 }, // mas barata, sin edge
        { label: 'X', odds: 2.6, edgePct: 5 }, // con valor detectado
        { label: '2', odds: 2.9 },
      ]),
    ];

    const [pick] = pickMatchesForRisk(matches, 'Medio', 1);
    expect(pick.selection).toBe('Empate');
    expect(pick.odds).toBe(2.6);
    expect(pick.edgePct).toBe(5);
  });

  it('entre partidos, prioriza los que tienen valor aunque su cuota no sea la mas baja', () => {
    const matches = [
      match('barato', 'A', 'B', [{ label: '1', odds: 2.0 }]),
      match('con_valor', 'C', 'D', [{ label: '1', odds: 2.7, edgePct: 6 }]),
    ];

    const [primero] = pickMatchesForRisk(matches, 'Medio', 1);
    expect(primero.matchId).toBe('con_valor');
  });

  it('no cuenta un edge por debajo del umbral como "de valor" para priorizar', () => {
    const matches = [
      match('barato', 'A', 'B', [{ label: '1', odds: 2.0 }]),
      match('edge_chico', 'C', 'D', [{ label: '1', odds: 2.7, edgePct: 1 }]), // < MIN_VALUE_EDGE_PCT
    ];

    const [primero] = pickMatchesForRisk(matches, 'Medio', 1);
    expect(primero.matchId).toBe('barato');
  });

  it('entre dos con valor, ordena por mayor edge primero', () => {
    const matches = [
      match('valor_chico', 'A', 'B', [{ label: '1', odds: 2.1, edgePct: 4 }]),
      match('valor_grande', 'C', 'D', [{ label: '1', odds: 2.7, edgePct: 9 }]),
    ];

    const [primero, segundo] = pickMatchesForRisk(matches, 'Medio', 2);
    expect(primero.matchId).toBe('valor_grande');
    expect(segundo.matchId).toBe('valor_chico');
  });

  it('descarta partidos en vivo', () => {
    const vivo = { ...match('m1', 'A', 'B', [{ label: '1', odds: 1.5 }]), isLive: true };
    expect(pickMatchesForRisk([vivo], 'Bajo', 1)).toEqual([]);
  });
});

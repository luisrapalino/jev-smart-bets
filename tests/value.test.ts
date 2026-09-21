import { describe, expect, it } from 'vitest';

import { computeEdge, devigProbabilities, isValueBet, median } from '@/lib/odds/value';

describe('devigProbabilities', () => {
  it('quita el margen para que las probabilidades sumen 1', () => {
    // 1.29 / 5.5 / 11.75 tienen overround (>100% de probabilidad implicita)
    const probs = devigProbabilities([1.29, 5.5, 11.75]);
    const total = probs.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('mantiene las proporciones relativas entre resultados', () => {
    const [home, draw, away] = devigProbabilities([2, 4, 4]);
    expect(draw).toBeCloseTo(away, 10);
    expect(home).toBeGreaterThan(draw);
  });
});

describe('computeEdge', () => {
  it('da edge negativo cuando la cuota ofrecida es la misma que genero la probabilidad justa', () => {
    // Comparar una cuota con vig contra su propia version de-vigueada
    // siempre muestra edge negativo: asi se ve el margen de la casa.
    const [fairProb] = devigProbabilities([1.29, 5.5, 11.75]);
    const { edgePct } = computeEdge(1.29, fairProb);
    expect(edgePct).toBeLessThan(0);
  });

  it('da edge positivo cuando la cuota ofrecida paga mas que la cuota justa', () => {
    const { edgePct, fairOdds } = computeEdge(2.1, 0.4); // cuota justa = 2.5
    expect(fairOdds).toBeCloseTo(2.5, 10);
    // 2.1 paga MENOS que 2.5: edge negativo, no de valor
    expect(edgePct).toBeLessThan(0);

    const positivo = computeEdge(2.8, 0.4); // 2.8 paga mas que la cuota justa de 2.5
    expect(positivo.edgePct).toBeGreaterThan(0);
  });
});

describe('isValueBet', () => {
  it('exige superar el umbral minimo, no solo ser positivo', () => {
    expect(isValueBet(1)).toBe(false); // positivo pero dentro del ruido
    expect(isValueBet(2.99)).toBe(false);
    expect(isValueBet(3)).toBe(true);
    expect(isValueBet(undefined)).toBe(false);
  });
});

describe('median', () => {
  it('calcula la mediana con cantidad impar de valores', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('promedia los dos centrales con cantidad par de valores', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

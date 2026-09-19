import { describe, expect, it } from 'vitest';

import { calculateParlayOdds, formatOdds } from '@/lib/utils';

describe('calculateParlayOdds', () => {
  it('multiplica las cuotas de la combinada', () => {
    expect(calculateParlayOdds([2, 3])).toBeCloseTo(6);
    expect(calculateParlayOdds([1.85, 1.51])).toBeCloseTo(2.7935);
  });

  it('devuelve 1 con el boleto vacio, para que el pago sea igual al stake', () => {
    expect(calculateParlayOdds([])).toBe(1);
  });
});

describe('formatOdds', () => {
  it('siempre usa dos decimales: las cuotas se comparan en columna', () => {
    expect(formatOdds(2)).toBe('2.00');
    expect(formatOdds(1.5)).toBe('1.50');
    expect(formatOdds(11.756)).toBe('11.76');
  });
});

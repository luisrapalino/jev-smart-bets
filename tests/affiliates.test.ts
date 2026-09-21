import { afterEach, describe, expect, it } from 'vitest';

import {
  AFFILIATE_OPERATORS,
  buildAffiliateUrl,
  getAffiliateOperator,
} from '@/lib/affiliates/operators';

afterEach(() => {
  delete process.env.AFFILIATE_ID_BET365;
});

describe('buildAffiliateUrl', () => {
  it('apunta a la seccion de futbol del operador cuando no hay id de afiliado', () => {
    expect(buildAffiliateUrl('bet365')).toBe('https://www.bet365.com/#/AS/B1/');
  });

  it('agrega el id con el parametro propio de cada operador', () => {
    process.env.AFFILIATE_ID_BET365 = 'abc123';
    expect(buildAffiliateUrl('bet365')).toBe('https://www.bet365.com/?affiliate=abc123#/AS/B1/');
  });

  it('falla ante un operador desconocido en vez de generar un enlace roto', () => {
    expect(() => buildAffiliateUrl('casa-inventada')).toThrow(/desconocido/i);
  });
});

describe('getAffiliateOperator', () => {
  it('resuelve cada operador declarado', () => {
    for (const operator of AFFILIATE_OPERATORS) {
      expect(getAffiliateOperator(operator.id)?.name).toBe(operator.name);
    }
  });

  it('devuelve undefined si no existe', () => {
    expect(getAffiliateOperator('nope')).toBeUndefined();
  });
});

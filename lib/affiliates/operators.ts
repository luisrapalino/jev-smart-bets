/**
 * Arquitectura modular de afiliados (ver seccion 2.2 de la spec).
 *
 * Cada operador tiene su propio parametro de afiliado. El id de afiliado
 * real se configura por variable de entorno (nunca hardcodeado) y solo se
 * usa server-side, para no exponerlo en el bundle del cliente.
 */
export interface AffiliateOperator {
  id: string;
  name: string;
  homepage: string;
  affiliateParam: string;
}

export const AFFILIATE_OPERATORS: AffiliateOperator[] = [
  {
    id: 'bet365',
    name: 'Bet365',
    homepage: 'https://www.bet365.com',
    affiliateParam: 'affiliate',
  },
  {
    id: 'rushbet',
    name: 'Rushbet',
    homepage: 'https://www.rushbet.co',
    affiliateParam: 'btag',
  },
  {
    id: 'wplay',
    name: 'Wplay',
    homepage: 'https://www.wplay.co',
    affiliateParam: 'ref',
  },
];

export function getAffiliateOperator(operatorId: string): AffiliateOperator | undefined {
  return AFFILIATE_OPERATORS.find((op) => op.id === operatorId);
}

export function buildAffiliateUrl(operatorId: string): string {
  const operator = getAffiliateOperator(operatorId);
  if (!operator) {
    throw new Error(`Operador afiliado desconocido: ${operatorId}`);
  }

  const affiliateId = process.env[`AFFILIATE_ID_${operatorId.toUpperCase()}`];
  const url = new URL(operator.homepage);

  if (affiliateId) {
    url.searchParams.set(operator.affiliateParam, affiliateId);
  }

  return url.toString();
}

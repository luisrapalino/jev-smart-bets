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
  /**
   * Seccion de futbol del operador, no la home. No hay deep-link real a
   * una seleccion (nuestros IDs de partido vienen de The Odds API, que el
   * operador no conoce; eso requeriria una integracion certificada con
   * cada casa). Esto ahorra el paso de buscar el deporte a mano.
   * Verificado a mano el 2026-09-21; si el operador rehace su frontend
   * estas rutas pueden romper sin aviso.
   */
  soccerUrl: string;
  affiliateParam: string;
}

export const AFFILIATE_OPERATORS: AffiliateOperator[] = [
  {
    id: 'bet365',
    name: 'Bet365',
    soccerUrl: 'https://www.bet365.com/#/AS/B1/',
    affiliateParam: 'affiliate',
  },
  {
    id: 'rushbet',
    name: 'Rushbet',
    soccerUrl: 'https://www.rushbet.co/?page=sportsbook#filter/football/',
    affiliateParam: 'btag',
  },
  {
    id: 'wplay',
    name: 'Wplay',
    soccerUrl: 'https://apuestas.wplay.co/es/s/FOOT/F%C3%BAtbol',
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
  const url = new URL(operator.soccerUrl);

  if (affiliateId) {
    url.searchParams.set(operator.affiliateParam, affiliateId);
  }

  return url.toString();
}

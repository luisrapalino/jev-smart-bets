import type { Match } from './types';
import { SIMULATED_MATCHES } from './simulated';

/**
 * Adaptador modular de proveedor de cuotas deportivas.
 *
 * Usa The Odds API cuando ODDS_API_KEY esta configurada (ver
 * lib/odds/the-odds-api.ts); en caso contrario, o si la llamada falla,
 * cae de vuelta a datos simulados para que la app siga siendo utilizable
 * en desarrollo sin credenciales.
 *
 * Los resultados se cachean en app/api/odds/route.ts (memoria del
 * proceso hoy; configurar KV_REST_API_URL/TOKEN -ver lib/cache/kv.ts-
 * antes de desplegar, o el cache no se comparte entre instancias
 * serverless y el cupo gratuito de The Odds API se agota rapido).
 */
export interface OddsProvider {
  getMatches(): Promise<Match[]>;
}

const simulatedProvider: OddsProvider = {
  async getMatches() {
    return SIMULATED_MATCHES;
  },
};

export const oddsProvider: OddsProvider = {
  async getMatches() {
    if (!process.env.ODDS_API_KEY) {
      return simulatedProvider.getMatches();
    }

    try {
      const { theOddsApiProvider } = await import('./the-odds-api');
      return await theOddsApiProvider.getMatches();
    } catch (error) {
      console.error('[odds] Fallo The Odds API, usando datos simulados:', error);
      return simulatedProvider.getMatches();
    }
  },
};

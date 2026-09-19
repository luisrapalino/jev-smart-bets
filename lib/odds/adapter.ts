import type { Match } from './types';

/**
 * Adaptador modular de proveedor de cuotas deportivas.
 *
 * En produccion, implementa este contrato contra The Odds API o Sportradar:
 *   const res = await fetch(`https://api.the-odds-api.com/v4/sports/...`, {
 *     headers: { Authorization: `Bearer ${process.env.ODDS_API_KEY}` },
 *   });
 *
 * Los resultados se cachean en Vercel KV / Redis (ver app/api/odds/route.ts)
 * para reducir latencia y consumo de cuota del proveedor.
 */
export interface OddsProvider {
  getMatches(): Promise<Match[]>;
}

const SIMULATED_MATCHES: Match[] = [
  {
    id: 'm1',
    league: 'UEFA Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    isLive: false,
    market1x2: [
      { label: '1', odds: 1.85 },
      { label: 'X', odds: 3.6 },
      { label: '2', odds: 4.2 },
    ],
    trend: 'up',
  },
  {
    id: 'm2',
    league: 'UEFA Champions League',
    homeTeam: 'Bayern Munich',
    awayTeam: 'PSG',
    startTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isLive: true,
    minute: 35,
    homeScore: 1,
    awayScore: 0,
    market1x2: [
      { label: '1', odds: 1.45 },
      { label: 'X', odds: 4.1 },
      { label: '2', odds: 6.5 },
    ],
    trend: 'stable',
  },
  {
    id: 'm3',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    isLive: false,
    market1x2: [
      { label: '1', odds: 2.1 },
      { label: 'X', odds: 3.4 },
      { label: '2', odds: 3.5 },
    ],
    trend: 'down',
  },
];

export const oddsProvider: OddsProvider = {
  async getMatches() {
    return SIMULATED_MATCHES;
  },
};

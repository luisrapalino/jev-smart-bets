import type { Match, OddsSelection } from './types';
import type { OddsProvider } from './adapter';

const API_BASE = 'https://api.the-odds-api.com/v4';

// Ligas de futbol soportadas. Ver claves completas en:
// https://the-odds-api.com/sports-odds-data/sports-apis.html
const SPORT_KEYS: Record<string, string> = {
  soccer_uefa_champs_league: 'UEFA Champions League',
  soccer_epl: 'Premier League',
  soccer_spain_la_liga: 'La Liga',
};

interface TheOddsApiOutcome {
  name: string;
  price: number;
}

interface TheOddsApiMarket {
  key: string;
  outcomes: TheOddsApiOutcome[];
}

interface TheOddsApiBookmaker {
  key: string;
  markets: TheOddsApiMarket[];
}

interface TheOddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: TheOddsApiBookmaker[];
}

// Snapshot en memoria de la ultima cuota "1" por partido, usado para
// calcular la tendencia (sube/baja/estable) entre polls sucesivos.
const previousHomeOdds = new Map<string, number>();

function toMarket1x2(
  event: TheOddsApiEvent,
  homeTeam: string,
  awayTeam: string
): OddsSelection[] | null {
  const bookmaker = event.bookmakers[0];
  const market = bookmaker?.markets.find((m) => m.key === 'h2h');
  if (!market) return null;

  const home = market.outcomes.find((o) => o.name === homeTeam);
  const away = market.outcomes.find((o) => o.name === awayTeam);
  const draw = market.outcomes.find((o) => o.name === 'Draw');

  if (!home || !away || !draw) return null;

  return [
    { label: '1', odds: home.price },
    { label: 'X', odds: draw.price },
    { label: '2', odds: away.price },
  ];
}

function computeTrend(matchId: string, homeOdds: number): Match['trend'] {
  const previous = previousHomeOdds.get(matchId);
  previousHomeOdds.set(matchId, homeOdds);

  if (previous === undefined) return 'stable';
  if (homeOdds > previous) return 'up';
  if (homeOdds < previous) return 'down';
  return 'stable';
}

async function fetchSport(sportKey: string, league: string, apiKey: string): Promise<Match[]> {
  const url = new URL(`${API_BASE}/sports/${sportKey}/odds`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'eu');
  url.searchParams.set('markets', 'h2h');
  url.searchParams.set('oddsFormat', 'decimal');
  url.searchParams.set('dateFormat', 'iso');

  const res = await fetch(url, { next: { revalidate: 15 } });

  if (!res.ok) {
    throw new Error(`The Odds API respondio ${res.status} para ${sportKey}`);
  }

  const events: TheOddsApiEvent[] = await res.json();

  return events
    .map((event): Match | null => {
      const market1x2 = toMarket1x2(event, event.home_team, event.away_team);
      if (!market1x2) return null;

      const homeOdds = market1x2[0].odds;

      return {
        id: event.id,
        league,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        startTime: event.commence_time,
        isLive: new Date(event.commence_time).getTime() <= Date.now(),
        market1x2,
        trend: computeTrend(event.id, homeOdds),
      };
    })
    .filter((match): match is Match => match !== null);
}

export const theOddsApiProvider: OddsProvider = {
  async getMatches() {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('ODDS_API_KEY no esta configurada');
    }

    const results = await Promise.all(
      Object.entries(SPORT_KEYS).map(([sportKey, league]) =>
        fetchSport(sportKey, league, apiKey)
      )
    );

    return results.flat();
  },
};

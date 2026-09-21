import type { Match, OddsSelection } from './types';
import type { OddsProvider } from './adapter';
import { computeEdge, devigProbabilities, median, MAX_ODDS_FOR_VALUE } from './value';

// Libro de referencia para estimar la probabilidad justa: Pinnacle es el
// estandar de facto por su margen bajo y limites altos (sus lineas son
// las mas dificiles de "vencer" en el mercado). Si no cotiza un partido,
// se cae a la mediana de los libros disponibles.
const REFERENCE_BOOKMAKER = 'pinnacle';
// Con menos libros que esto, la mediana de respaldo no es confiable y no
// se calcula edge (mejor no mostrar nada a mostrar un falso positivo).
const MIN_BOOKS_FOR_FALLBACK_REFERENCE = 3;

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

interface Quote {
  home: number;
  draw: number;
  away: number;
}

// La cuota mas alta entre ~20 libros a veces es un unico libro con una
// linea vieja o mal cargada, sobre todo en mercados poco liquidos (un
// visitante muy perdedor). Usar directamente ese maximo perseguiria
// lineas que se corrigen o anulan antes de poder jugarlas. Se exige que
// al menos otro libro corrobore un precio parecido: la segunda cuota mas
// alta, no la primera.
function representativePrice(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => b - a);
  return sorted.length > 1 ? sorted[1] : sorted[0];
}

function toMarket1x2(
  event: TheOddsApiEvent,
  homeTeam: string,
  awayTeam: string
): OddsSelection[] | null {
  const quotes: Quote[] = [];
  let reference: Quote | undefined;

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === 'h2h');
    const home = market?.outcomes.find((o) => o.name === homeTeam)?.price;
    const away = market?.outcomes.find((o) => o.name === awayTeam)?.price;
    const draw = market?.outcomes.find((o) => o.name === 'Draw')?.price;
    if (!home || !away || !draw) continue;

    const quote = { home, draw, away };
    quotes.push(quote);
    if (bookmaker.key === REFERENCE_BOOKMAKER) reference = quote;
  }

  if (quotes.length === 0) return null;

  // Mejor precio corroborado por resultado, comprado entre todos los
  // libros del feed (no necesariamente del mismo libro para los tres).
  const bestHome = representativePrice(quotes.map((q) => q.home));
  const bestDraw = representativePrice(quotes.map((q) => q.draw));
  const bestAway = representativePrice(quotes.map((q) => q.away));

  // Con un solo libro no hay nada que "comprar": la mejor cuota es la
  // unica cuota, y compararla contra su propia version de-vigueada
  // siempre da edge negativo (asi es como se ve el margen de la casa).
  if (quotes.length < 2) {
    return [
      { label: '1', odds: bestHome },
      { label: 'X', odds: bestDraw },
      { label: '2', odds: bestAway },
    ];
  }

  if (!reference && quotes.length >= MIN_BOOKS_FOR_FALLBACK_REFERENCE) {
    reference = {
      home: median(quotes.map((q) => q.home)),
      draw: median(quotes.map((q) => q.draw)),
      away: median(quotes.map((q) => q.away)),
    };
  }

  if (!reference) {
    return [
      { label: '1', odds: bestHome },
      { label: 'X', odds: bestDraw },
      { label: '2', odds: bestAway },
    ];
  }

  const [fairHome, fairDraw, fairAway] = devigProbabilities([
    reference.home,
    reference.draw,
    reference.away,
  ]);

  // Mas alla de MAX_ODDS_FOR_VALUE el de-vig proporcional sobreestima la
  // probabilidad justa (favorite-longshot bias): no se calcula edge para
  // ese resultado, se muestra solo la cuota.
  const edgeIfEligible = (odds: number, referenceOdds: number, fairProbability: number) =>
    referenceOdds > MAX_ODDS_FOR_VALUE ? {} : computeEdge(odds, fairProbability);

  return [
    { label: '1', odds: bestHome, ...edgeIfEligible(bestHome, reference.home, fairHome) },
    { label: 'X', odds: bestDraw, ...edgeIfEligible(bestDraw, reference.draw, fairDraw) },
    { label: '2', odds: bestAway, ...edgeIfEligible(bestAway, reference.away, fairAway) },
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { theOddsApiProvider } from '@/lib/odds/the-odds-api';

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt-1',
    sport_key: 'soccer_epl',
    commence_time: new Date(Date.now() + 3_600_000).toISOString(),
    home_team: 'Arsenal',
    away_team: 'Lille',
    bookmakers: [
      {
        key: 'pinnacle',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Arsenal', price: 1.29 },
              { name: 'Lille', price: 11.75 },
              { name: 'Draw', price: 5.5 },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Responde con el evento sólo para una liga; el resto vacío. */
function mockFetch(events: unknown[], sportKey = 'soccer_epl') {
  return vi.fn(async (url: string | URL) => {
    const matches = String(url).includes(sportKey);
    return new Response(JSON.stringify(matches ? events : []), { status: 200 });
  });
}

beforeEach(() => {
  process.env.ODDS_API_KEY = 'test-key';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ODDS_API_KEY;
});

describe('adaptador de The Odds API', () => {
  it('exige la API key en vez de llamar sin credencial', async () => {
    delete process.env.ODDS_API_KEY;
    await expect(theOddsApiProvider.getMatches()).rejects.toThrow(/ODDS_API_KEY/);
  });

  it('manda la key y pide cuotas decimales del mercado h2h', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);

    await theOddsApiProvider.getMatches();

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('apiKey')).toBe('test-key');
    expect(url.searchParams.get('markets')).toBe('h2h');
    expect(url.searchParams.get('oddsFormat')).toBe('decimal');
  });

  it('mapea los resultados a las columnas 1 / X / 2 por nombre de equipo', async () => {
    vi.stubGlobal('fetch', mockFetch([event()]));

    const [match] = await theOddsApiProvider.getMatches();

    expect(match.homeTeam).toBe('Arsenal');
    expect(match.awayTeam).toBe('Lille');
    expect(match.league).toBe('Premier League');
    expect(match.market1x2).toEqual([
      { label: '1', odds: 1.29 },
      { label: 'X', odds: 5.5 },
      { label: '2', odds: 11.75 },
    ]);
  });

  it('descarta eventos sin mercado h2h completo en vez de publicar cuotas a medias', async () => {
    const sinEmpate = event({
      bookmakers: [
        {
          key: 'pinnacle',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 1.29 },
                { name: 'Lille', price: 11.75 },
              ],
            },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', mockFetch([sinEmpate]));

    await expect(theOddsApiProvider.getMatches()).resolves.toEqual([]);
  });

  it('marca en vivo un partido cuyo horario ya paso', async () => {
    const empezado = event({
      id: 'evt-live',
      commence_time: new Date(Date.now() - 60_000).toISOString(),
    });
    vi.stubGlobal('fetch', mockFetch([empezado]));

    const [match] = await theOddsApiProvider.getMatches();
    expect(match.isLive).toBe(true);
  });

  it('calcula la tendencia comparando contra el sondeo anterior', async () => {
    vi.stubGlobal('fetch', mockFetch([event({ id: 'evt-trend' })]));
    const [primera] = await theOddsApiProvider.getMatches();
    // Sin historial previo no hay movimiento que reportar.
    expect(primera.trend).toBe('stable');

    const subio = event({
      id: 'evt-trend',
      bookmakers: [
        {
          key: 'pinnacle',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 1.5 },
                { name: 'Lille', price: 11.75 },
                { name: 'Draw', price: 5.5 },
              ],
            },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', mockFetch([subio]));
    const [segunda] = await theOddsApiProvider.getMatches();
    expect(segunda.trend).toBe('up');
  });
});

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

  it('detecta valor cuando dos libros sueltos corroboran un precio mejor que Pinnacle', async () => {
    const conValor = event({
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
        {
          key: 'libro_blando_a',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 1.25 },
                { name: 'Lille', price: 16 },
                { name: 'Draw', price: 5.2 },
              ],
            },
          ],
        },
        {
          // Corrobora el precio del visitante; sin este segundo libro no
          // se confiaria en el 16 de arriba (podria ser una linea vieja).
          key: 'libro_blando_b',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 1.26 },
                { name: 'Lille', price: 15.5 },
                { name: 'Draw', price: 5.1 },
              ],
            },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', mockFetch([conValor]));

    const [match] = await theOddsApiProvider.getMatches();
    const away = match.market1x2.find((s) => s.label === '2');

    // El maximo (16) se descarta por no tener corroboracion; se usa la
    // segunda cuota mas alta (15.5), respaldada por dos libros.
    expect(away?.odds).toBe(15.5);
    expect(away?.edgePct).toBeGreaterThan(0);
    expect(away?.fairOdds).toBeCloseTo(1 / (1 / 11.75 / (1 / 1.29 + 1 / 5.5 + 1 / 11.75)), 5);
  });

  it('no persigue el maximo si es un unico libro sin corroborar (linea potencialmente vieja)', async () => {
    const outlier = event({
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
        {
          key: 'libro_desactualizado',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 1.25 },
                { name: 'Lille', price: 60 },
                { name: 'Draw', price: 5.2 },
              ],
            },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', mockFetch([outlier]));

    const [match] = await theOddsApiProvider.getMatches();
    const away = match.market1x2.find((s) => s.label === '2');

    // Solo hay 2 libros: el 60 no tiene con que corroborarse, se cae al
    // precio de Pinnacle (el otro valor disponible).
    expect(away?.odds).toBe(11.75);
  });

  it('no calcula edge con un solo libro: no hay nada que comprar', async () => {
    vi.stubGlobal('fetch', mockFetch([event()]));

    const [match] = await theOddsApiProvider.getMatches();
    expect(match.market1x2.every((s) => s.edgePct === undefined)).toBe(true);
  });
});

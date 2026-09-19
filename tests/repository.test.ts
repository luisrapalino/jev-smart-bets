import { beforeAll, describe, expect, it } from 'vitest';

// El repositorio elige implementacion al importarse: sin DATABASE_URL
// es el de memoria, que es justamente el del modo demo.
beforeAll(() => {
  delete process.env.DATABASE_URL;
});

const { betsFor } = await import('@/lib/db/repository');

const selection = {
  matchName: 'Arsenal vs Lille',
  market: 'Resultado Final (1X2)',
  selection: 'Arsenal',
  odds: 1.29,
};

function bet(stake: number) {
  return {
    totalOdds: 1.29,
    stake,
    potentialPayout: stake * 1.29,
    operatorId: 'bet365',
    selections: [selection],
  };
}

const ana = betsFor('sesion-ana');
const beto = betsFor('sesion-beto');

describe('repositorio en memoria (modo demo)', () => {
  it('guarda una apuesta con id y estado inicial', async () => {
    const saved = await ana.saveBet(bet(10));
    expect(saved.id).toBeTruthy();
    expect(saved.status).toBe('PENDING');
    expect(saved.selections).toEqual([selection]);
  });

  it('liquida una apuesta propia y responde null ante una inexistente', async () => {
    const saved = await ana.saveBet(bet(10));
    const settled = await ana.settleBet(saved.id, 'LOST');
    expect(settled?.status).toBe('LOST');
    await expect(ana.settleBet('no-existe', 'WON')).resolves.toBeNull();
  });

  it('lista las apuestas de la mas reciente a la mas antigua', async () => {
    const primera = await ana.saveBet(bet(11));
    const segunda = await ana.saveBet(bet(12));
    const listado = await ana.listBets(10);
    const posPrimera = listado.findIndex((b) => b.id === primera.id);
    const posSegunda = listado.findIndex((b) => b.id === segunda.id);
    expect(posSegunda).toBeLessThan(posPrimera);
  });

  it('cuenta solo los prompts posteriores al corte', async () => {
    const corte = new Date();
    await ana.savePrompt({
      promptText: 'combinada de bajo riesgo',
      riskProfile: 'Bajo',
      confidenceScore: 92,
    });
    expect(await ana.countPromptsSince(corte)).toBe(1);
  });

  it('devuelve las liquidadas mas recientes primero, sin las pendientes', async () => {
    const perdida = await ana.saveBet(bet(13));
    await ana.settleBet(perdida.id, 'LOST');
    const estados = await ana.recentSettledStatuses(5);
    expect(estados[0]).toBe('LOST');
    expect(estados).not.toContain('PENDING');
  });
});

describe('aislamiento entre sesiones', () => {
  it('cada sesion solo ve su propio historial', async () => {
    const deAna = await ana.saveBet(bet(50));
    const deBeto = await beto.saveBet(bet(70));

    const listaBeto = await beto.listBets(50);
    expect(listaBeto.map((b) => b.id)).toContain(deBeto.id);
    expect(listaBeto.map((b) => b.id)).not.toContain(deAna.id);
  });

  it('no se puede liquidar la apuesta de otra sesion', async () => {
    const deAna = await ana.saveBet(bet(20));
    await expect(beto.settleBet(deAna.id, 'WON')).resolves.toBeNull();

    const sigueIgual = (await ana.listBets(50)).find((b) => b.id === deAna.id);
    expect(sigueIgual?.status).toBe('PENDING');
  });

  it('el riesgo se calcula por sesion: la actividad ajena no cuenta', async () => {
    const unaHora = new Date(Date.now() - 3_600_000);
    const nueva = betsFor('sesion-recien-llegada');

    // Ana lleva mucho apostado; una sesion nueva tiene que arrancar en cero,
    // o el filtro marcaria a cualquiera apenas el sitio tuviera trafico.
    expect(await ana.sumStakeSince(unaHora)).toBeGreaterThan(0);
    expect(await nueva.sumStakeSince(unaHora)).toBe(0);
    expect(await nueva.countPromptsSince(unaHora)).toBe(0);
  });
});

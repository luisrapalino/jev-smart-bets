import { beforeAll, describe, expect, it } from 'vitest';

// El repositorio elige implementacion al importarse: sin DATABASE_URL
// es el de memoria, que es justamente el del modo demo.
beforeAll(() => {
  delete process.env.DATABASE_URL;
});

const { betsRepository } = await import('@/lib/db/repository');

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

describe('repositorio en memoria (modo demo)', () => {
  it('guarda una apuesta con id y estado inicial', async () => {
    const saved = await betsRepository.saveBet(bet(10));
    expect(saved.id).toBeTruthy();
    expect(saved.status).toBe('PENDING');
    expect(saved.selections).toEqual([selection]);
  });

  it('liquida una apuesta existente y responde null ante una inexistente', async () => {
    const saved = await betsRepository.saveBet(bet(10));
    const settled = await betsRepository.settleBet(saved.id, 'LOST');
    expect(settled?.status).toBe('LOST');
    await expect(betsRepository.settleBet('no-existe', 'WON')).resolves.toBeNull();
  });

  it('lista las apuestas de la mas reciente a la mas antigua', async () => {
    const primera = await betsRepository.saveBet(bet(11));
    const segunda = await betsRepository.saveBet(bet(12));
    const listado = await betsRepository.listBets(10);
    const posPrimera = listado.findIndex((b) => b.id === primera.id);
    const posSegunda = listado.findIndex((b) => b.id === segunda.id);
    expect(posSegunda).toBeLessThan(posPrimera);
  });

  it('alimenta el filtro de riesgo: suma el stake de la ultima hora e ignora lo viejo', async () => {
    const dentro = await betsRepository.sumStakeSince(new Date(Date.now() - 3_600_000));
    const futuro = await betsRepository.sumStakeSince(new Date(Date.now() + 1_000));
    expect(dentro).toBeGreaterThan(0);
    expect(futuro).toBe(0);
  });

  it('cuenta solo los prompts posteriores al corte', async () => {
    const corte = new Date();
    await betsRepository.savePrompt({
      promptText: 'combinada de bajo riesgo',
      riskProfile: 'Bajo',
      confidenceScore: 92,
    });
    expect(await betsRepository.countPromptsSince(corte)).toBe(1);
  });

  it('devuelve las liquidadas mas recientes primero, sin las pendientes', async () => {
    const perdida = await betsRepository.saveBet(bet(13));
    await betsRepository.settleBet(perdida.id, 'LOST');
    const estados = await betsRepository.recentSettledStatuses(5);
    expect(estados[0]).toBe('LOST');
    expect(estados).not.toContain('PENDING');
  });
});

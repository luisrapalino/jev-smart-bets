import { describe, expect, it } from 'vitest';

import { jevClient } from '@/lib/jev/client';

const NO_ACTIVITY = { promptsLastHour: 0, totalStakeLastHour: 0, consecutiveLosses: 0 };

describe('filtro de Juego Responsable', () => {
  it('no marca a un usuario sin actividad', async () => {
    const result = await jevClient.score(NO_ACTIVITY);
    expect(result.score).toBe(0);
    expect(result.flagged).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('marca cuando la actividad combinada cruza el umbral', async () => {
    const result = await jevClient.score({
      promptsLastHour: 8, // 40 pts (tope)
      totalStakeLastHour: 300, // 30 pts (tope)
      consecutiveLosses: 0,
    });
    expect(result.score).toBe(70);
    expect(result.flagged).toBe(true);
    expect(result.reason).toMatch(/pausa/i);
  });

  it('pondera la racha de perdidas consecutivas', async () => {
    const sinRacha = await jevClient.score({ ...NO_ACTIVITY, promptsLastHour: 4 });
    const conRacha = await jevClient.score({
      ...NO_ACTIVITY,
      promptsLastHour: 4,
      consecutiveLosses: 3,
    });
    expect(conRacha.score).toBeGreaterThan(sinRacha.score);
  });

  it('nunca pasa de 100, por extrema que sea la actividad', async () => {
    const result = await jevClient.score({
      promptsLastHour: 500,
      totalStakeLastHour: 100_000,
      consecutiveLosses: 50,
    });
    expect(result.score).toBe(100);
  });

  it('responde sin credenciales: es una funcion de seguridad, no puede depender de la API', async () => {
    delete process.env.TYPESAFE_API_KEY;
    await expect(jevClient.score(NO_ACTIVITY)).resolves.toBeDefined();
  });
});

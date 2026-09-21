import { afterEach, describe, expect, it } from 'vitest';

import { requestMagicLink, verifyMagicLink } from '@/lib/auth/magic-link';

// Cuentas necesitan persistencia real (ver lib/auth/magic-link.ts): a
// diferencia del resto de las integraciones, esta no tiene modo demo
// con datos simulados. Lo que si se puede probar sin DB es que se
// niega explicitamente en vez de fallar de forma confusa.
describe('magic link sin DATABASE_URL configurada', () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('requestMagicLink avisa que hace falta base de datos en vez de fallar oscuro', async () => {
    delete process.env.DATABASE_URL;
    await expect(requestMagicLink('a@b.com')).rejects.toThrow(/DATABASE_URL/);
  });

  it('verifyMagicLink devuelve null en vez de lanzar', async () => {
    delete process.env.DATABASE_URL;
    await expect(verifyMagicLink('cualquier-token')).resolves.toBeNull();
  });
});

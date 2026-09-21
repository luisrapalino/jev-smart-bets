import { and, eq, gte, isNull } from 'drizzle-orm';

import { db, isDatabaseEnabled } from '../db';
import { magicLinkTokens, users } from '../db/schema';

const TOKEN_TTL_MINUTES = 15;

export interface MagicLinkRequestResult {
  token: string;
  expiresAt: Date;
}

/**
 * Cuentas necesitan persistencia real: sin DATABASE_URL no hay forma de
 * reconocer al mismo usuario en otro dispositivo, asi que a diferencia
 * del resto de las integraciones esta no tiene modo demo con datos
 * simulados -- exige la base configurada.
 */
export async function requestMagicLink(email: string): Promise<MagicLinkRequestResult> {
  if (!isDatabaseEnabled) {
    throw new Error('DATABASE_URL no esta configurada: las cuentas necesitan base de datos');
  }

  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  const [row] = await db!.insert(magicLinkTokens).values({ email, expiresAt }).returning();
  return { token: row.token, expiresAt: row.expiresAt };
}

export interface VerifiedIdentity {
  userId: string;
  email: string;
}

/**
 * Consume el token de una sola vez (marcarlo consumido y verificar que
 * no lo estuviera ya es una sola operacion atomica, para que dos
 * pedidos simultaneos con el mismo token no lo canjeen dos veces) y
 * devuelve el usuario, creandolo por email si es la primera vez.
 */
export async function verifyMagicLink(token: string): Promise<VerifiedIdentity | null> {
  if (!isDatabaseEnabled) return null;

  const [row] = await db!
    .update(magicLinkTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(magicLinkTokens.token, token),
        isNull(magicLinkTokens.consumedAt),
        gte(magicLinkTokens.expiresAt, new Date())
      )
    )
    .returning();

  if (!row) return null;

  const [existing] = await db!.select().from(users).where(eq(users.email, row.email));
  if (existing) return { userId: existing.id, email: existing.email };

  const [created] = await db!.insert(users).values({ email: row.email }).returning();
  return { userId: created.id, email: created.email };
}

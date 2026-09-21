import { cookies } from 'next/headers';

const SESSION_COOKIE = 'jev_session';
const USER_COOKIE = 'jev_user';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ONE_YEAR_SECONDS,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Identidad anonima por dispositivo, o la de una cuenta real si el
 * usuario entro con magic link (ver lib/auth/magic-link.ts).
 *
 * No hay cuentas obligatorias a proposito: la app no custodia dinero ni
 * datos personales, eso vive en el operador. Pero el historial y sobre
 * todo el filtro de Juego Responsable necesitan saber de quien es la
 * actividad -- sin esto, el motor de riesgo sumaria la actividad de
 * todos los visitantes y marcaria a cualquiera.
 *
 * Logueado devuelve `user:<id>`, un espacio de claves separado del uuid
 * crudo que usa la sesion anonima: asi una cuenta nueva nunca choca por
 * casualidad con un uuid de sesion anonima ya guardado.
 *
 * Solo se puede escribir cookies desde Route Handlers o Server Actions,
 * asi que esta funcion se llama desde los handlers.
 */
export async function getIdentityKey(): Promise<string> {
  const store = await cookies();

  const userId = store.get(USER_COOKIE)?.value;
  if (userId) return `user:${userId}`;

  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  store.set(SESSION_COOKIE, sessionId, cookieOptions);
  return sessionId;
}

/** El uuid de sesion anonima crudo, si hay uno (para migrar su historial al loguearse). */
export async function getAnonymousSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function setUserCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE, userId, cookieOptions);
}

export async function clearUserCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

/** Email de la cuenta activa, si hay una logueada. Para mostrar en la UI. */
export async function getCurrentUserId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(USER_COOKIE)?.value;
}

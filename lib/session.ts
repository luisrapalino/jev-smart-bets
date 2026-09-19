import { cookies } from 'next/headers';

const SESSION_COOKIE = 'jev_session';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Identidad anonima por dispositivo.
 *
 * No hay cuentas a proposito: la app no custodia dinero ni datos
 * personales, eso vive en el operador. Pero el historial y sobre todo
 * el filtro de Juego Responsable necesitan saber de quien es la
 * actividad -- sin esto, el motor de riesgo sumaria la actividad de
 * todos los visitantes y marcaria a cualquiera.
 *
 * Es identidad de dispositivo, no de persona: borrar cookies empieza de
 * cero. El dia que haya cuentas reales, esta columna es la costura para
 * enlazarlas.
 *
 * Solo se puede escribir la cookie desde Route Handlers o Server
 * Actions, asi que esta funcion se llama desde los handlers.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });

  return sessionId;
}

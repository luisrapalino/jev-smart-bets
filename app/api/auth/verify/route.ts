import { NextResponse } from 'next/server';

import { verifyMagicLink } from '@/lib/auth/magic-link';
import { migrateAnonymousHistory } from '@/lib/db/repository';
import { getAnonymousSessionId, setUserCookie } from '@/lib/session';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  const origin = new URL(req.url).origin;

  if (!token) {
    return NextResponse.redirect(new URL('/?auth=missing_token', origin));
  }

  const identity = await verifyMagicLink(token);
  if (!identity) {
    return NextResponse.redirect(new URL('/?auth=invalid_token', origin));
  }

  // La actividad de la sesion anonima (si la hubo) pasa a la cuenta
  // nueva en vez de perderse: ver migrateAnonymousHistory.
  const anonSessionId = await getAnonymousSessionId();
  if (anonSessionId) {
    await migrateAnonymousHistory(anonSessionId, `user:${identity.userId}`);
  }

  await setUserCookie(identity.userId);

  return NextResponse.redirect(new URL('/?auth=success', origin));
}

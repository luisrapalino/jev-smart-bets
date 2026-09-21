import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requestMagicLink } from '@/lib/auth/magic-link';
import { sendMagicLinkEmail } from '@/lib/auth/send-magic-link-email';
import { isDatabaseEnabled } from '@/lib/db';

const RequestSchema = z.object({ email: z.email() });

export async function POST(req: Request) {
  if (!isDatabaseEnabled) {
    return NextResponse.json(
      { error: 'Las cuentas necesitan DATABASE_URL configurada en este entorno' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
  }

  try {
    const { token } = await requestMagicLink(parsed.data.email);
    const origin = new URL(req.url).origin;
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`;
    const { delivered } = await sendMagicLinkEmail(parsed.data.email, verifyUrl);

    return NextResponse.json({
      success: true,
      // Solo se expone el link cuando no hay proveedor de email
      // configurado (modo demo, ver send-magic-link-email.ts): nunca se
      // manda al cliente si el correo salio de verdad.
      devLink: delivered ? undefined : verifyUrl,
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo generar el link' }, { status: 500 });
  }
}

const RESEND_API = 'https://api.resend.com/emails';

export interface SendResult {
  delivered: boolean;
}

/**
 * Sin RESEND_API_KEY, el link se loguea en la consola del server en vez
 * de mandarse por correo -- el mismo patron de degradacion que el resto
 * de las integraciones (ver .env.example), para poder probar el login
 * sin credenciales.
 */
export async function sendMagicLinkEmail(email: string, verifyUrl: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[auth] RESEND_API_KEY no configurada. Magic link para ${email}: ${verifyUrl}`);
    return { delivered: false };
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Jev Smart Bets <onboarding@resend.dev>',
      to: email,
      subject: 'Tu link para entrar a Jev Smart Bets',
      html: `<p>Entra con este link (vence en 15 minutos):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    }),
  });

  if (!res.ok) {
    console.error('[auth] Resend fallo al enviar el magic link:', res.status, await res.text());
    return { delivered: false };
  }

  return { delivered: true };
}

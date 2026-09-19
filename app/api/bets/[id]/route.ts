import { NextResponse } from 'next/server';
import { z } from 'zod';

import { betsFor } from '@/lib/db/repository';
import { getOrCreateSessionId } from '@/lib/session';

const SettleBetSchema = z.object({
  status: z.enum(['WON', 'LOST']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = SettleBetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 });
    }

    // Acotado a la sesion: una apuesta de otro dispositivo no existe aqui.
    const sessionId = await getOrCreateSessionId();
    const bet = await betsFor(sessionId).settleBet(id, parsed.data.status);

    if (!bet) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bet });
  } catch {
    return NextResponse.json({ error: 'Error liquidando la apuesta' }, { status: 500 });
  }
}

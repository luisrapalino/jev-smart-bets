import { NextResponse } from 'next/server';
import { z } from 'zod';

import { betsRepository } from '@/lib/db/repository';

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

    const bet = await betsRepository.settleBet(id, parsed.data.status);

    if (!bet) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bet });
  } catch {
    return NextResponse.json({ error: 'Error liquidando la apuesta' }, { status: 500 });
  }
}

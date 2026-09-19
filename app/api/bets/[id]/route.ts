import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { betHistory } from '@/lib/db/schema';

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

    const [bet] = await db
      .update(betHistory)
      .set({ status: parsed.data.status })
      .where(eq(betHistory.id, id))
      .returning();

    if (!bet) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bet });
  } catch {
    return NextResponse.json({ error: 'Error liquidando la apuesta' }, { status: 500 });
  }
}

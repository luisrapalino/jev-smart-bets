import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { betHistory } from '@/lib/db/schema';

const ConfirmBetSchema = z.object({
  totalOdds: z.number().positive(),
  stake: z.number().positive(),
  potentialPayout: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ConfirmBetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de apuesta invalidos' }, { status: 400 });
    }

    const [bet] = await db.insert(betHistory).values(parsed.data).returning();

    return NextResponse.json({ success: true, data: bet });
  } catch {
    return NextResponse.json({ error: 'Error guardando la apuesta' }, { status: 500 });
  }
}

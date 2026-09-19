import { NextResponse } from 'next/server';
import { count, desc, gte, ne, sum } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { betHistory, userPrompts } from '@/lib/db/schema';
import { AFFILIATE_OPERATORS, buildAffiliateUrl } from '@/lib/affiliates/operators';
import { jevClient } from '@/lib/jev/client';

const operatorIds = AFFILIATE_OPERATORS.map((op) => op.id) as [string, ...string[]];

const ConfirmBetSchema = z.object({
  totalOdds: z.number().positive(),
  stake: z.number().positive(),
  potentialPayout: z.number().positive(),
  operatorId: z.enum(operatorIds),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ConfirmBetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de apuesta invalidos' }, { status: 400 });
    }

    const [bet] = await db.insert(betHistory).values(parsed.data).returning();
    const redirectUrl = buildAffiliateUrl(parsed.data.operatorId);
    const riskCheck = await evaluateResponsibleGamblingRisk();

    return NextResponse.json({ success: true, data: bet, redirectUrl, riskCheck });
  } catch {
    return NextResponse.json({ error: 'Error guardando la apuesta' }, { status: 500 });
  }
}

async function evaluateResponsibleGamblingRisk() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [promptsRow] = await db
    .select({ value: count() })
    .from(userPrompts)
    .where(gte(userPrompts.createdAt, oneHourAgo));

  const [stakeRow] = await db
    .select({ value: sum(betHistory.stake) })
    .from(betHistory)
    .where(gte(betHistory.createdAt, oneHourAgo));

  return jevClient.score({
    promptsLastHour: promptsRow?.value ?? 0,
    totalStakeLastHour: Number(stakeRow?.value ?? 0),
    consecutiveLosses: await countConsecutiveLosses(),
  });
}

async function countConsecutiveLosses(): Promise<number> {
  const recentSettled = await db
    .select({ status: betHistory.status })
    .from(betHistory)
    .where(ne(betHistory.status, 'PENDING'))
    .orderBy(desc(betHistory.createdAt))
    .limit(20);

  let streak = 0;
  for (const bet of recentSettled) {
    if (bet.status !== 'LOST') break;
    streak += 1;
  }
  return streak;
}

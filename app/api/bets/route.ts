import { NextResponse } from 'next/server';
import { z } from 'zod';

import { betsRepository } from '@/lib/db/repository';
import { AFFILIATE_OPERATORS, buildAffiliateUrl } from '@/lib/affiliates/operators';
import { jevClient } from '@/lib/jev/client';

const operatorIds = AFFILIATE_OPERATORS.map((op) => op.id) as [string, ...string[]];

const SelectionSchema = z.object({
  matchName: z.string(),
  market: z.string(),
  selection: z.string(),
  odds: z.number().positive(),
});

const ConfirmBetSchema = z.object({
  totalOdds: z.number().positive(),
  stake: z.number().positive(),
  potentialPayout: z.number().positive(),
  operatorId: z.enum(operatorIds),
  selections: z.array(SelectionSchema).min(1),
});

export async function GET() {
  try {
    const bets = await betsRepository.listBets(30);
    return NextResponse.json({ success: true, data: bets });
  } catch {
    return NextResponse.json({ error: 'Error cargando el historial' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ConfirmBetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de apuesta invalidos' }, { status: 400 });
    }

    const bet = await betsRepository.saveBet(parsed.data);
    const redirectUrl = buildAffiliateUrl(parsed.data.operatorId);
    const riskCheck = await evaluateResponsibleGamblingRisk();

    return NextResponse.json({ success: true, data: bet, redirectUrl, riskCheck });
  } catch {
    return NextResponse.json({ error: 'Error guardando la apuesta' }, { status: 500 });
  }
}

async function evaluateResponsibleGamblingRisk() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [promptsLastHour, totalStakeLastHour, settled] = await Promise.all([
    betsRepository.countPromptsSince(oneHourAgo),
    betsRepository.sumStakeSince(oneHourAgo),
    betsRepository.recentSettledStatuses(20),
  ]);

  let consecutiveLosses = 0;
  for (const status of settled) {
    if (status !== 'LOST') break;
    consecutiveLosses += 1;
  }

  return jevClient.score({ promptsLastHour, totalStakeLastHour, consecutiveLosses });
}

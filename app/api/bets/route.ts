import { NextResponse } from 'next/server';
import { z } from 'zod';

import { betsFor, type BetsRepository } from '@/lib/db/repository';
import { getOrCreateSessionId } from '@/lib/session';
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
    const sessionId = await getOrCreateSessionId();
    const bets = await betsFor(sessionId).listBets(30);
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

    const sessionId = await getOrCreateSessionId();
    const repository = betsFor(sessionId);

    // El chequeo corre ANTES de guardar: un aviso que llega despues de
    // que la apuesta ya se guardo y el usuario ya esta en el operador no
    // protege a nadie, solo decora. Si ya esta en riesgo alto, la apuesta
    // ni se registra ni se redirige.
    const riskCheck = await evaluateResponsibleGamblingRisk(repository, parsed.data.stake);
    if (riskCheck.flagged) {
      return NextResponse.json({ success: false, blocked: true, riskCheck }, { status: 403 });
    }

    const bet = await repository.saveBet(parsed.data);
    const redirectUrl = buildAffiliateUrl(parsed.data.operatorId);

    return NextResponse.json({ success: true, data: bet, redirectUrl, riskCheck });
  } catch {
    return NextResponse.json({ error: 'Error guardando la apuesta' }, { status: 500 });
  }
}

// Se mide la actividad de ESTA sesion: un contador global marcaria a
// cualquiera en cuanto el sitio tuviera trafico. Corre antes de guardar,
// asi que `pendingStake` sube el total con la apuesta que se esta por
// confirmar: si no se sumara, una primera apuesta enorme nunca se
// bloquearia (el historial previo estaria vacio).
async function evaluateResponsibleGamblingRisk(repository: BetsRepository, pendingStake: number) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [promptsLastHour, stakeSoFar, settled] = await Promise.all([
    repository.countPromptsSince(oneHourAgo),
    repository.sumStakeSince(oneHourAgo),
    repository.recentSettledStatuses(20),
  ]);

  let consecutiveLosses = 0;
  for (const status of settled) {
    if (status !== 'LOST') break;
    consecutiveLosses += 1;
  }

  return jevClient.score({
    promptsLastHour,
    totalStakeLastHour: stakeSoFar + pendingStake,
    consecutiveLosses,
  });
}

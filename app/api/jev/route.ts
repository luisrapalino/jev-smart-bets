import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { userPrompts } from '@/lib/db/schema';
import { JevBetResponseSchema, JevPromptRequestSchema } from '@/lib/jev/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedRequest = JevPromptRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Prompt es requerido' }, { status: 400 });
    }

    const { prompt } = parsedRequest.data;

    // SIMULATED JEV ENGINE LATENCY & RESPONSE
    // Replace with official Jev SDK instance in production:
    // const jevResult = await jevClient.evaluate({ prompt });

    const simulatedResponse = {
      queryIntent: prompt,
      riskProfile: 'Bajo',
      confidenceScore: 92,
      suggestedBets: [
        {
          matchId: 'm1',
          matchName: 'Real Madrid vs Barcelona',
          selection: 'Real Madrid Gana',
          market: 'Resultado Final (1X2)',
          odds: 1.85,
        },
        {
          matchId: 'm3',
          matchName: 'Arsenal vs Chelsea',
          selection: 'Mas de 1.5 Goles',
          market: 'Total de Goles',
          odds: 1.51,
        },
      ],
    };

    const validatedData = JevBetResponseSchema.parse(simulatedResponse);

    await db.insert(userPrompts).values({
      promptText: validatedData.queryIntent,
      riskProfile: validatedData.riskProfile,
      confidenceScore: validatedData.confidenceScore,
    });

    return NextResponse.json({
      success: true,
      data: validatedData,
      meta: {
        latencyMs: 84,
        engine: 'Jev System One',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error procesando solicitud en Jev' }, { status: 500 });
  }
}

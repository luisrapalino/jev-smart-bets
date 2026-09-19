import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { userPrompts } from '@/lib/db/schema';
import { jevClient } from '@/lib/jev/client';
import { JevBetResponseSchema, JevPromptRequestSchema, type JevBetResponse } from '@/lib/jev/schemas';

function simulateJevResponse(prompt: string): JevBetResponse {
  return JevBetResponseSchema.parse({
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
  });
}

async function getJevResponse(prompt: string): Promise<{ data: JevBetResponse; engine: string }> {
  try {
    const data = await jevClient.evaluate({ prompt });
    return { data, engine: 'Jev System One' };
  } catch (error) {
    console.error('[jev] Fallo la evaluacion real, usando respuesta simulada:', error);
    return { data: simulateJevResponse(prompt), engine: 'Jev System One (simulado)' };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedRequest = JevPromptRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Prompt es requerido' }, { status: 400 });
    }

    const { prompt } = parsedRequest.data;
    const { data: validatedData, engine } = await getJevResponse(prompt);

    await db.insert(userPrompts).values({
      promptText: validatedData.queryIntent,
      riskProfile: validatedData.riskProfile,
      confidenceScore: validatedData.confidenceScore,
    });

    return NextResponse.json({
      success: true,
      data: validatedData,
      meta: { engine },
    });
  } catch {
    return NextResponse.json({ error: 'Error procesando solicitud en Jev' }, { status: 500 });
  }
}

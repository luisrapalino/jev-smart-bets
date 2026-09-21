import { NextResponse } from 'next/server';

import { oddsProvider } from '@/lib/odds/adapter';
import { getCached, setCached } from '@/lib/cache/kv';
import type { Match } from '@/lib/odds/types';

const CACHE_KEY = 'odds:matches';
// 15s agotaba el cupo gratuito de The Odds API (500 creditos/mes) en
// menos de una hora de trafico sostenido, incluso con cache compartido
// funcionando perfecto -- y sin KV_REST_API_URL configurada (el default
// hoy) el cache es en memoria del proceso, que en serverless ni
// siquiera se comparte entre instancias. 120s corta el consumo ~8x; el
// costo es que un partido en vivo puede tardar hasta 2 minutos en
// reflejar un cambio de cuota o de marcador.
const CACHE_TTL_SECONDS = 120;

export async function GET() {
  const cached = await getCached<Match[]>(CACHE_KEY);

  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  const matches = await oddsProvider.getMatches();
  await setCached(CACHE_KEY, matches, CACHE_TTL_SECONDS);

  return NextResponse.json({ success: true, data: matches, cached: false });
}

import { NextResponse } from 'next/server';

import { oddsProvider } from '@/lib/odds/adapter';
import { getCached, setCached } from '@/lib/cache/kv';
import type { Match } from '@/lib/odds/types';

const CACHE_KEY = 'odds:matches';
const CACHE_TTL_SECONDS = 15;

export async function GET() {
  const cached = await getCached<Match[]>(CACHE_KEY);

  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  const matches = await oddsProvider.getMatches();
  await setCached(CACHE_KEY, matches, CACHE_TTL_SECONDS);

  return NextResponse.json({ success: true, data: matches, cached: false });
}

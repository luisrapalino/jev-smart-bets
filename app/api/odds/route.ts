import { NextResponse } from 'next/server';

import { oddsProvider } from '@/lib/odds/adapter';

// Cache en memoria de corta duracion. En produccion, reemplazar por
// Vercel KV / Redis compartido entre instancias serverless.
let cache: { data: Awaited<ReturnType<typeof oddsProvider.getMatches>>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15_000;

export async function GET() {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json({ success: true, data: cache.data, cached: true });
  }

  const matches = await oddsProvider.getMatches();
  cache = { data: matches, expiresAt: Date.now() + CACHE_TTL_MS };

  return NextResponse.json({ success: true, data: matches, cached: false });
}

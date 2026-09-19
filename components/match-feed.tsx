'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { MatchCard } from '@/components/match-card';
import { getLeagueMeta } from '@/lib/ui/league-meta';
import { cn } from '@/lib/utils';
import type { Match } from '@/lib/odds/types';

async function fetchMatches(): Promise<Match[]> {
  const res = await fetch('/api/odds');
  if (!res.ok) throw new Error('No se pudieron cargar los partidos');
  const json = await res.json();
  return json.data;
}

function groupByLeague(matches: Match[]): [string, Match[]][] {
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const group = groups.get(match.league) ?? [];
    group.push(match);
    groups.set(match.league, group);
  }
  return Array.from(groups.entries());
}

function MatchCardSkeleton() {
  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="bg-muted h-3 w-16 animate-pulse rounded" />
      <div className="flex items-center gap-2">
        <div className="bg-muted size-9 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-muted size-9 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-muted h-12 animate-pulse rounded-md" />
        <div className="bg-muted h-12 animate-pulse rounded-md" />
        <div className="bg-muted h-12 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

// Tope del escalonado: con muchas tarjetas por liga, un delay lineal
// haria esperar demasiado a las ultimas.
const MAX_STAGGER_STEPS = 8;

export function MatchFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 15_000,
  });

  // La entrada escalonada se juega una sola vez, en la primera carga: el
  // refetch cada 15s no debe volver a animar todo el feed.
  const [revealed, setRevealed] = useState(false);
  const hasData = Boolean(data);
  const frame = useRef<number>(undefined);

  useEffect(() => {
    if (!hasData || revealed) return;
    // Un frame de espera deja pintar el estado inicial (oculto) antes de
    // aplicar .is-shown, que es lo que dispara la transicion.
    frame.current = requestAnimationFrame(() => setRevealed(true));
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [hasData, revealed]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
        <AlertCircle className="size-4 shrink-0" />
        Error al cargar el feed de partidos. Intenta de nuevo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByLeague(data).map(([league, matches]) => {
        const { icon: Icon, gradient } = getLeagueMeta(league);

        return (
          <div key={league} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-md bg-linear-to-br text-white',
                  gradient
                )}
              >
                <Icon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold">{league}</h3>
              <span className="text-muted-foreground text-xs">{matches.length}</span>
            </div>
            <div
              className={cn(
                't-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
                revealed && 'is-shown'
              )}
            >
              {matches.map((match, i) => (
                <div
                  key={match.id}
                  className="t-stagger-line"
                  style={{
                    transitionDelay: `calc(var(--stagger-stagger) * ${Math.min(
                      i,
                      MAX_STAGGER_STEPS
                    )})`,
                  }}
                >
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

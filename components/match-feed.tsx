'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { MatchRow } from '@/components/match-row';
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

function RowSkeleton() {
  return (
    <div className="border-rule flex items-center gap-3 border-b px-4 py-2.5">
      <div className="bg-muted h-3 w-10 shrink-0 animate-pulse rounded-sm" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="bg-muted h-3.5 w-32 animate-pulse rounded-sm" />
        <div className="bg-muted h-3.5 w-24 animate-pulse rounded-sm" />
      </div>
      <div className="flex shrink-0 gap-1">
        <div className="bg-muted h-10 w-14 animate-pulse rounded-sm sm:w-16" />
        <div className="bg-muted h-10 w-14 animate-pulse rounded-sm sm:w-16" />
        <div className="bg-muted h-10 w-14 animate-pulse rounded-sm sm:w-16" />
      </div>
    </div>
  );
}

export function MatchFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border-destructive/40 text-destructive mx-4 flex items-center gap-2 rounded-sm border px-4 py-3 text-sm">
        <AlertCircle className="size-4 shrink-0" strokeWidth={1.5} />
        No se pudo cargar el tablero. Intenta de nuevo.
      </div>
    );
  }

  return (
    <div>
      {groupByLeague(data).map(([league, matches]) => (
        <section key={league}>
          {/* Los rotulos 1/X/2 van una sola vez, como cabecera de columna:
              repetirlos en cada celda es ruido, y ningun tablero lo hace. */}
          <div className="board-condensed border-rule bg-board-raised text-chalk-dim sticky top-10.25 z-20 flex items-center gap-3 border-y px-4 py-1.5 text-xs">
            <h3 className="flex-1 font-semibold tracking-wide">
              {league}
              <span className="price ml-2 font-normal opacity-60">{matches.length}</span>
            </h3>
            <div className="flex shrink-0 gap-1" aria-hidden="true">
              {['1', 'X', '2'].map((label) => (
                <span key={label} className="w-14 text-center sm:w-16">
                  {label}
                </span>
              ))}
            </div>
          </div>
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </section>
      ))}
    </div>
  );
}

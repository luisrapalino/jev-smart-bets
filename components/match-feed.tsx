'use client';

import { useQuery } from '@tanstack/react-query';

import { MatchCard } from '@/components/match-card';
import type { Match } from '@/lib/odds/types';

async function fetchMatches(): Promise<Match[]> {
  const res = await fetch('/api/odds');
  if (!res.ok) throw new Error('No se pudieron cargar los partidos');
  const json = await res.json();
  return json.data;
}

export function MatchFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando partidos...</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-destructive text-sm">
        Error al cargar el feed de partidos. Intenta de nuevo.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}

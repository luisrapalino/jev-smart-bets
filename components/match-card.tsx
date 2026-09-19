'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import type { Match } from '@/lib/odds/types';

export function MatchCard({ match }: { match: Match }) {
  const selections = useBetslipStore((s) => s.selections);
  const addSelection = useBetslipStore((s) => s.addSelection);

  const Trend = { up: TrendingUp, down: TrendingDown, stable: Minus }[match.trend];
  const trendColor = {
    up: 'text-primary',
    down: 'text-destructive',
    stable: 'text-muted-foreground',
  }[match.trend];

  const marketLabels: Record<string, string> = {
    '1': match.homeTeam,
    X: 'Empate',
    '2': match.awayTeam,
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{match.league}</p>
          <p className="text-sm font-medium">
            {match.homeTeam} vs {match.awayTeam}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {match.isLive ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
              EN VIVO {match.minute}&apos;
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              {new Date(match.startTime).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <Trend className={cn('size-4', trendColor)} />
        </div>
      </CardHeader>
      <CardContent>
        {match.isLive && (
          <p className="mb-2 text-lg font-semibold">
            {match.homeScore} - {match.awayScore}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {match.market1x2.map((sel) => {
            const selectionId = `${match.id}-1x2-${sel.label}`;
            const isSelected = selections.some((s) => s.id === selectionId);

            return (
              <Button
                key={sel.label}
                variant={isSelected ? 'default' : 'outline'}
                className="flex h-auto flex-col py-2"
                onClick={() =>
                  addSelection({
                    id: selectionId,
                    matchId: match.id,
                    matchName: `${match.homeTeam} vs ${match.awayTeam}`,
                    selection: marketLabels[sel.label],
                    market: 'Resultado Final (1X2)',
                    odds: sel.odds,
                  })
                }
              >
                <span className="text-xs opacity-80">{sel.label}</span>
                <span className="font-semibold">{formatOdds(sel.odds)}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

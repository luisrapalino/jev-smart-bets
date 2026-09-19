'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import { TeamBadge } from '@/lib/ui/team-badge';
import { PopNumber } from '@/lib/ui/pop-number';
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
    <Card className="gap-3 py-3 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          {match.isLive ? (
            <span className="flex items-center gap-1.5 font-semibold text-destructive">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
              EN VIVO {match.minute ? `${match.minute}'` : ''}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {new Date(match.startTime).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <Trend className={cn('size-4', trendColor)} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <TeamBadge name={match.homeTeam} />
            <span className="truncate text-sm font-medium">{match.homeTeam}</span>
          </div>
          {match.isLive && match.homeScore !== undefined ? (
            <span className="text-lg font-bold tabular-nums">{match.homeScore}</span>
          ) : (
            <span className="text-muted-foreground text-[10px] font-semibold">VS</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <TeamBadge name={match.awayTeam} />
            <span className="truncate text-sm font-medium">{match.awayTeam}</span>
          </div>
          {match.isLive && match.awayScore !== undefined && (
            <span className="text-lg font-bold tabular-nums">{match.awayScore}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
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
                <PopNumber value={formatOdds(sel.odds)} className="font-semibold" />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Plus, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import { TeamBadge } from '@/lib/ui/team-badge';
import { JevThinking } from '@/components/jev-thinking';
import type { JevBetResponse } from '@/lib/jev/schemas';

const riskColor: Record<JevBetResponse['riskProfile'], string> = {
  Bajo: 'text-primary',
  Medio: 'text-amber-500',
  Alto: 'text-destructive',
};

export function AiSuggestionsFeed({
  result,
  isLoading,
}: {
  result: JevBetResponse | null;
  isLoading: boolean;
}) {
  const addSelection = useBetslipStore((s) => s.addSelection);
  const selections = useBetslipStore((s) => s.selections);

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-center gap-2 py-6 text-center">
          <Sparkles className="text-primary size-4 animate-pulse" />
          <JevThinking />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Sparkles className="text-primary size-4" />
            Sugerencias de Jev
          </CardTitle>
          <span className={cn('text-xs font-semibold', riskColor[result.riskProfile])}>
            Riesgo {result.riskProfile} &middot; {result.confidenceScore}% confianza
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {result.suggestedBets.map((bet) => {
          const selectionId = `${bet.matchId}-jev-${bet.selection}`;
          const isSelected = selections.some((s) => s.id === selectionId);

          return (
            <div
              key={selectionId}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <TeamBadge name={bet.selection} size="sm" />
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium">{bet.matchName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {bet.market} &middot; {bet.selection}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold">{formatOdds(bet.odds)}</span>
                <Button
                  size="icon"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() =>
                    addSelection({
                      id: selectionId,
                      matchId: bet.matchId,
                      matchName: bet.matchName,
                      selection: bet.selection,
                      market: bet.market,
                      odds: bet.odds,
                    })
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

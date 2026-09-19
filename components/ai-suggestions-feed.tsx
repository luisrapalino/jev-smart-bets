'use client';

import { Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
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
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground text-sm">Jev esta armando tu boleto...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Sugerencias de Jev</CardTitle>
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
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{bet.matchName}</p>
                <p className="text-muted-foreground text-xs">
                  {bet.market} &middot; {bet.selection}
                </p>
              </div>
              <div className="flex items-center gap-2">
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

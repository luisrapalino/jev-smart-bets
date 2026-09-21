'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import { TeamBadge } from '@/lib/ui/team-badge';
import { PopNumber } from '@/lib/ui/pop-number';
import { JevThinking } from '@/components/jev-thinking';
import { isValueBet } from '@/lib/odds/value';
import type { JevBetResponse } from '@/lib/jev/schemas';

const riskColor: Record<JevBetResponse['riskProfile'], string> = {
  Bajo: 'text-price-up',
  Medio: 'text-bulb',
  Alto: 'text-price-down',
};

export function AiSuggestionsFeed({
  result,
  isLoading,
  latencyMs,
}: {
  result: JevBetResponse | null;
  isLoading: boolean;
  latencyMs?: number;
}) {
  const addSelection = useBetslipStore((s) => s.addSelection);
  const selections = useBetslipStore((s) => s.selections);

  if (isLoading) {
    return (
      <div className="border-rule flex items-center justify-center rounded-md border py-5">
        <JevThinking />
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="border-rule rounded-md border">
      <div className="border-rule flex items-baseline justify-between border-b px-3 py-2">
        <span className="board-condensed text-sm font-semibold">Jev sugiere</span>
        <span className="flex items-baseline gap-3 text-xs">
          <span className={cn('font-semibold', riskColor[result.riskProfile])}>
            Riesgo {result.riskProfile}
          </span>
          <span className="text-chalk-dim price">{result.confidenceScore}% confianza</span>
          {latencyMs !== undefined && (
            <span className="text-chalk-dim price">{latencyMs}ms</span>
          )}
        </span>
      </div>

      {result.suggestedBets.map((bet) => {
        const selectionId = `${bet.matchId}-jev-${bet.selection}`;
        const isSelected = selections.some((s) => s.id === selectionId);

        return (
          <div
            key={selectionId}
            className="border-rule flex items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TeamBadge name={bet.selection} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm">{bet.matchName}</p>
                <p className="text-chalk-dim truncate text-xs">
                  {bet.market}, {bet.selection}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isValueBet(bet.edgePct) && (
                <span
                  title={`Valor: paga ${bet.edgePct!.toFixed(1)}% mas que la cuota justa estimada`}
                  className="bg-price-up text-accent rounded-full px-1.5 py-0.5 text-[10px] leading-tight font-bold"
                >
                  +{bet.edgePct!.toFixed(0)}%
                </span>
              )}
              <PopNumber value={formatOdds(bet.odds)} className="price text-bulb font-bold" />
              <Button
                size="icon"
                variant={isSelected ? 'default' : 'outline'}
                className="size-8"
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
                <Plus className="size-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { cn, formatOdds } from '@/lib/utils';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import { TeamBadge } from '@/lib/ui/team-badge';
import { PopNumber } from '@/lib/ui/pop-number';
import type { Match } from '@/lib/odds/types';
import { isValueBet } from '@/lib/odds/value';

export function MatchRow({ match }: { match: Match }) {
  const selections = useBetslipStore((s) => s.selections);
  const addSelection = useBetslipStore((s) => s.addSelection);

  const teamForLabel: Record<string, string> = {
    '1': match.homeTeam,
    X: 'Empate',
    '2': match.awayTeam,
  };

  return (
    <div className="border-rule flex items-center gap-3 border-b px-4 py-2 last:border-b-0">
      <div className="w-12 shrink-0">
        {match.isLive ? (
          <span className="text-price-down flex items-center gap-1 text-[10px] font-semibold">
            <span className="bg-price-down size-1.5 animate-pulse rounded-full" />
            VIVO
          </span>
        ) : (
          <span className="text-chalk-dim price text-xs">
            {new Date(match.startTime).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <TeamLine
          name={match.homeTeam}
          score={match.isLive ? match.homeScore : undefined}
        />
        <TeamLine
          name={match.awayTeam}
          score={match.isLive ? match.awayScore : undefined}
        />
      </div>

      <div className="flex shrink-0 gap-1">
        {match.market1x2.map((sel) => {
          const selectionId = `${match.id}-1x2-${sel.label}`;
          const isSelected = selections.some((s) => s.id === selectionId);
          // El proveedor entrega una sola tendencia por partido, calculada
          // sobre el precio local: solo esa celda puede marcarla.
          const movement = sel.label === '1' ? match.trend : 'stable';
          const hasValue = isValueBet(sel.edgePct);

          return (
            <button
              key={sel.label}
              type="button"
              onClick={() =>
                addSelection({
                  id: selectionId,
                  matchId: match.id,
                  matchName: `${match.homeTeam} vs ${match.awayTeam}`,
                  selection: teamForLabel[sel.label],
                  market: 'Resultado Final (1X2)',
                  odds: sel.odds,
                  source: 'board',
                })
              }
              aria-label={
                hasValue
                  ? `${teamForLabel[sel.label]} a ${formatOdds(sel.odds)}, cuota de valor, ${sel.edgePct?.toFixed(1)}% sobre el precio justo estimado`
                  : `${teamForLabel[sel.label]} a ${formatOdds(sel.odds)}`
              }
              title={
                hasValue
                  ? `Valor: paga ${sel.edgePct?.toFixed(1)}% mas que la cuota justa estimada (cuota justa ~${sel.fairOdds?.toFixed(2)}). Referencia de mercado, no la cuota exacta del operador.`
                  : undefined
              }
              className={cn(
                'board-condensed price relative flex w-14 items-center justify-center gap-0.5 rounded-sm py-2 text-base font-bold transition-[scale,background-color,color] duration-150 ease-out active:scale-[0.96] sm:w-16',
                isSelected
                  ? 'bg-bulb text-primary-foreground'
                  : 'text-bulb bg-accent hover:bg-[#2c261d]',
                hasValue && !isSelected && 'ring-price-up ring-1'
              )}
            >
              {hasValue && (
                <span
                  aria-hidden="true"
                  className="bg-price-up text-accent absolute -top-1.5 -right-1.5 rounded-full px-1 text-[8px] leading-tight font-bold"
                >
                  +{sel.edgePct!.toFixed(0)}%
                </span>
              )}
              <PopNumber value={formatOdds(sel.odds)} />
              {movement !== 'stable' && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-[9px] leading-none',
                    movement === 'up' ? 'text-price-up' : 'text-price-down'
                  )}
                >
                  {movement === 'up' ? '▲' : '▼'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TeamLine({ name, score }: { name: string; score?: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamBadge name={name} size="sm" />
      <span className="board-condensed truncate text-base">{name}</span>
      {score !== undefined && (
        <span className="price text-chalk ml-auto pl-2 text-sm font-bold">{score}</span>
      )}
    </div>
  );
}

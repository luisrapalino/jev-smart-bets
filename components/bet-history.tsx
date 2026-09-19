'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatOdds } from '@/lib/utils';
import { TeamBadge } from '@/lib/ui/team-badge';
import type { SavedBet } from '@/lib/db/repository';

async function fetchBets(): Promise<SavedBet[]> {
  const res = await fetch('/api/bets');
  if (!res.ok) throw new Error('No se pudo cargar el historial');
  const json = await res.json();
  return json.data;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  WON: 'Ganada',
  LOST: 'Perdida',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-chalk-dim',
  WON: 'text-price-up',
  LOST: 'text-price-down',
};

export function BetHistory() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['bets'], queryFn: fetchBets });

  const settle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'WON' | 'LOST' }) => {
      const res = await fetch(`/api/bets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('No se pudo liquidar');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bets'] }),
  });

  if (isLoading) {
    return <p className="text-chalk-dim px-4 py-6 text-sm">Cargando historial...</p>;
  }

  if (isError || !data) {
    return (
      <div className="border-destructive/40 text-destructive mx-4 flex items-center gap-2 rounded-sm border px-4 py-3 text-sm">
        <AlertCircle className="size-4 shrink-0" strokeWidth={1.5} />
        No se pudo cargar el historial.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-chalk-dim px-4 py-10 text-center text-sm">
        Todavia no has confirmado ninguna apuesta.
      </p>
    );
  }

  return (
    <div>
      {data.map((bet) => (
        <article key={bet.id} className="border-rule border-b px-4 py-3 last:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-chalk-dim price text-xs">
              {new Date(bet.createdAt).toLocaleString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            <span
              className={cn('board-condensed text-xs font-semibold', STATUS_STYLE[bet.status])}
            >
              {STATUS_LABEL[bet.status] ?? bet.status}
            </span>
          </div>

          <ul className="mt-2 flex flex-col gap-1">
            {(bet.selections ?? []).map((sel, i) => (
              <li key={i} className="flex items-center gap-2">
                <TeamBadge name={sel.selection} size="sm" />
                <span className="board-condensed min-w-0 flex-1 truncate text-sm">
                  {sel.matchName}
                </span>
                <span className="text-chalk-dim hidden truncate text-xs sm:block">
                  {sel.selection}
                </span>
                <span className="price text-bulb text-sm font-bold">
                  {formatOdds(sel.odds)}
                </span>
              </li>
            ))}
          </ul>

          <div className="text-chalk-dim mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="price">
              {formatCurrency(bet.stake)} a {formatOdds(bet.totalOdds)}
            </span>
            <span className="price">
              {bet.status === 'WON' ? 'Pago ' : 'Pago potencial '}
              <span className="text-chalk font-bold">
                {formatCurrency(bet.potentialPayout)}
              </span>
            </span>
          </div>

          {bet.status === 'PENDING' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-chalk-dim text-[11px]">Registrar resultado</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={settle.isPending}
                onClick={() => settle.mutate({ id: bet.id, status: 'WON' })}
              >
                Ganada
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={settle.isPending}
                onClick={() => settle.mutate({ id: bet.id, status: 'LOST' })}
              >
                Perdida
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

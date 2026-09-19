'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetslipStore } from '@/lib/store/use-betslip-store';
import { calculateParlayOdds, cn, formatCurrency, formatOdds } from '@/lib/utils';
import { AFFILIATE_OPERATORS } from '@/lib/affiliates/operators';
import { TeamBadge } from '@/lib/ui/team-badge';

export function BetslipDrawer() {
  const { selections, stake, isOpen, removeSelection, setStake, toggleOpen, clearSlip } =
    useBetslipStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState(AFFILIATE_OPERATORS[0].id);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);

  const totalOdds = calculateParlayOdds(selections.map((s) => s.odds));
  const potentialPayout = stake * totalOdds;

  async function handleConfirm() {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalOdds, stake, potentialPayout, operatorId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error('Error al confirmar');

      if (json.riskCheck?.flagged) {
        setRiskWarning(json.riskCheck.reason);
      }

      clearSlip();
      window.open(json.redirectUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setConfirmError('No se pudo confirmar la apuesta. Intenta de nuevo.');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {selections.length > 0 && !isOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => toggleOpen()}
            className={cn(
              'bg-primary text-primary-foreground fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-xl px-4 py-3 shadow-lg sm:inset-x-auto sm:right-6 sm:w-80'
            )}
          >
            <span className="text-sm font-medium">
              {selections.length} selecciones &middot; {formatOdds(totalOdds)}
            </span>
            <span className="text-sm font-semibold">{formatCurrency(potentialPayout)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <Drawer open={isOpen} onOpenChange={toggleOpen}>
        <DrawerContent>
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>Boleto de Apuestas</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          {riskWarning && (
            <div className="border-amber-500/50 bg-amber-500/10 mx-4 mb-2 flex items-start gap-2 rounded-md border px-3 py-2 text-xs text-amber-600">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Juego Responsable</p>
                <p>{riskWarning}</p>
              </div>
              <button
                type="button"
                onClick={() => setRiskWarning(null)}
                aria-label="Cerrar aviso"
                className="shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto px-4">
            {selections.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Selecciona cuotas del feed o pidele una combinada a Jev.
              </p>
            ) : (
              selections.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <TeamBadge name={s.selection} size="sm" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">{s.matchName}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {s.market} &middot; {s.selection}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{formatOdds(s.odds)}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeSelection(s.id)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DrawerFooter>
            <div className="flex items-center justify-between gap-3">
              <label className="flex flex-1 items-center gap-2 text-sm">
                Stake
                <Input
                  type="number"
                  min={1}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value) || 0)}
                />
              </label>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Cuota total {formatOdds(totalOdds)}</p>
                <p className="text-sm font-semibold">{formatCurrency(potentialPayout)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Operador</span>
              <div className="flex flex-1 gap-1">
                {AFFILIATE_OPERATORS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperatorId(op.id)}
                    className={cn(
                      'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                      operatorId === op.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearSlip}>
                Limpiar
              </Button>
              <Button
                className="flex-1"
                disabled={selections.length === 0 || isConfirming}
                onClick={handleConfirm}
              >
                {isConfirming ? 'Confirmando...' : 'Confirmar Apuesta'}
              </Button>
            </div>
            {confirmError && (
              <p className="text-destructive text-center text-xs">{confirmError}</p>
            )}
            <p className="text-muted-foreground text-center text-[11px]">
              Al confirmar seras redirigido al operador afiliado para completar tu apuesta con
              dinero real.
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

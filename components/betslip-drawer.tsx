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
import { PopNumber } from '@/lib/ui/pop-number';
import { BetConfirmedToast } from '@/components/bet-confirmed-toast';

export function BetslipDrawer() {
  const { selections, stake, isOpen, removeSelection, setStake, toggleOpen, clearSlip } =
    useBetslipStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState(AFFILIATE_OPERATORS[0].id);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const totalOdds = calculateParlayOdds(selections.map((s) => s.odds));
  const potentialPayout = stake * totalOdds;
  const operatorName =
    AFFILIATE_OPERATORS.find((op) => op.id === operatorId)?.name ?? 'el operador';

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
      if (isOpen) toggleOpen();
      setConfirmed(true);
      window.setTimeout(() => setConfirmed(false), 4000);
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
              'bg-bulb text-primary-foreground fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-md px-4 py-3 sm:inset-x-auto sm:right-6 sm:w-80'
            )}
          >
            <span className="text-sm font-medium">
              {selections.length} en el boleto a{' '}
              <span className="price font-bold">{formatOdds(totalOdds)}</span>
            </span>
            <span className="price text-sm font-bold">{formatCurrency(potentialPayout)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <Drawer open={isOpen} onOpenChange={toggleOpen}>
        <DrawerContent>
          <DrawerHeader className="mx-auto w-full max-w-2xl flex-row items-center justify-between">
            <DrawerTitle className="board-condensed">Tu boleto</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Cerrar boleto">
                <X className="size-4" strokeWidth={1.5} />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          {riskWarning && (
            <div className="border-bulb/40 text-bulb mx-4 mb-2 flex items-start gap-2 rounded-sm border px-3 py-2 text-xs">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
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

          <div className="mx-auto flex max-h-[45vh] w-full max-w-2xl flex-col gap-2 overflow-y-auto px-4">
            {selections.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Selecciona cuotas del feed o pidele una combinada a Jev.
              </p>
            ) : (
              selections.map((s) => (
                <div
                  key={s.id}
                  className="border-rule flex items-center justify-between gap-2 rounded-sm border px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <TeamBadge name={s.selection} size="sm" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm">{s.matchName}</p>
                      <p className="text-chalk-dim truncate text-xs">
                        {s.market}, {s.selection}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="price text-bulb text-sm font-bold">
                      {formatOdds(s.odds)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-[scale,color] duration-150 ease-out active:scale-[0.96]"
                      onClick={() => removeSelection(s.id)}
                      aria-label={`Quitar ${s.selection}`}
                    >
                      <Trash2 className="text-chalk-dim size-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DrawerFooter className="mx-auto w-full max-w-2xl">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                Stake
                <Input
                  type="number"
                  min={1}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value) || 0)}
                  className="price w-24"
                />
              </label>
              <div className="text-right">
                <p className="text-chalk-dim price text-xs">
                  Cuota total {formatOdds(totalOdds)}
                </p>
                <PopNumber
                  value={formatCurrency(potentialPayout)}
                  className="price text-bulb text-base font-bold"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-chalk-dim">Operador</span>
              <div className="flex flex-1 gap-1">
                {AFFILIATE_OPERATORS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperatorId(op.id)}
                    className={cn(
                      'flex-1 rounded-sm border px-2 py-1.5 text-xs font-medium transition-[scale,background-color,color,border-color] duration-150 ease-out active:scale-[0.96]',
                      operatorId === op.id
                        ? 'border-bulb text-bulb'
                        : 'border-rule text-chalk-dim hover:bg-accent'
                    )}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 transition-[scale,background-color] duration-150 ease-out active:scale-[0.96]"
                onClick={clearSlip}
              >
                Limpiar
              </Button>
              <Button
                className="flex-1 transition-[scale,background-color] duration-150 ease-out active:scale-[0.96]"
                disabled={selections.length === 0 || isConfirming}
                onClick={handleConfirm}
              >
                {isConfirming ? 'Confirmando' : 'Confirmar apuesta'}
              </Button>
            </div>
            {confirmError && (
              <p className="text-destructive text-center text-xs">{confirmError}</p>
            )}
            <p className="text-chalk-dim text-center text-[11px]">
              Al confirmar te llevamos al operador para completar la apuesta con dinero real.
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <BetConfirmedToast open={confirmed} operatorName={operatorName} />
    </>
  );
}

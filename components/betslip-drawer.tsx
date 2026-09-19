'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

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

export function BetslipDrawer() {
  const { selections, stake, isOpen, removeSelection, setStake, toggleOpen, clearSlip } =
    useBetslipStore();

  const totalOdds = calculateParlayOdds(selections.map((s) => s.odds));
  const potentialPayout = stake * totalOdds;

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

          <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto px-4">
            {selections.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Selecciona cuotas del feed o pidele una combinada a Jev.
              </p>
            ) : (
              selections.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{s.matchName}</p>
                    <p className="text-muted-foreground text-xs">
                      {s.market} &middot; {s.selection}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearSlip}>
                Limpiar
              </Button>
              <Button className="flex-1" disabled={selections.length === 0}>
                Confirmar Apuesta
              </Button>
            </div>
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

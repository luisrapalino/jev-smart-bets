'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Toast + success check (transitions.dev): el toast sube desde abajo con
 * cross-blur y el check dibuja su trazo al confirmarse la apuesta.
 */
export function BetConfirmedToast({ open, operatorName }: { open: boolean; operatorName: string }) {
  const checkRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const path = checkRef.current?.querySelector('path');
    if (!path) return;

    // Medir el largo real del trazo: con un dasharray fijo el check se
    // pre-revela o se sobre-dibuja.
    const length = Math.ceil(path.getTotalLength());
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        className={cn(
          't-toast border-border bg-card flex w-full items-center gap-3 rounded-xl border p-3 shadow-lg sm:w-80',
          open && 'is-open'
        )}
        role="status"
        aria-live="polite"
      >
        <span
          className="t-success-check text-primary"
          data-state={open ? 'in' : 'out'}
          aria-hidden="true"
        >
          <svg ref={checkRef} viewBox="0 0 48 48" fill="none" className="size-7">
            <path
              d="M14 24.5 L21 31.5 L34 17.5"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-medium">Apuesta registrada</p>
          <p className="text-muted-foreground text-xs">
            Te abrimos {operatorName} para completarla.
          </p>
        </div>
      </div>
    </div>
  );
}

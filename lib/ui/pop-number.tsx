'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { readCssTimeMs } from '@/lib/ui/css-time';

/**
 * Number pop-in (transitions.dev): cada caracter vuelve a entrar con un
 * desenfoque cuando el valor cambia.
 *
 * Se compara contra el valor anterior en vez de usar un flag de montaje:
 * con el doble efecto de Strict Mode, el flag se marcaba en la primera
 * pasada y la segunda animaba igual, de modo que el tablero entero
 * animaba al cargar. La clase se retira al terminar para que la pista de
 * `will-change` no quede viva en cientos de digitos en reposo.
 */
export function PopNumber({ value, className }: { value: string; className?: string }) {
  const groupRef = useRef<HTMLSpanElement>(null);
  const previousValue = useRef(value);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || previousValue.current === value) return;

    previousValue.current = value;

    group.classList.remove('is-animating');
    void group.offsetHeight; // force reflow
    group.classList.add('is-animating');

    const settleMs =
      readCssTimeMs('--digit-dur', 500) + readCssTimeMs('--digit-stagger', 70) * 2;
    const timer = window.setTimeout(() => group.classList.remove('is-animating'), settleMs);

    return () => window.clearTimeout(timer);
  }, [value]);

  const chars = value.split('');

  return (
    <span ref={groupRef} className={cn('t-digit-group', className)}>
      {/* Los digitos sueltos se leerian como "1 2 . 4 0"; se ocultan de la
          capa de accesibilidad y se expone el valor completo. */}
      <span className="sr-only">{value}</span>
      {chars.map((char, i) => (
        <span
          key={i}
          className="t-digit"
          aria-hidden="true"
          data-stagger={
            i === chars.length - 2 ? '1' : i === chars.length - 1 ? '2' : undefined
          }
        >
          {char}
        </span>
      ))}
    </span>
  );
}

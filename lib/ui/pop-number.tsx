'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Number pop-in (transitions.dev): cada caracter vuelve a entrar con un
 * desenfoque cuando el valor cambia. No anima en el montaje -- solo
 * cuando el numero se actualiza -- para que cargar el feed completo no
 * dispare cientos de animaciones a la vez.
 */
export function PopNumber({ value, className }: { value: string; className?: string }) {
  const groupRef = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    group.classList.remove('is-animating');
    void group.offsetHeight; // force reflow
    group.classList.add('is-animating');
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

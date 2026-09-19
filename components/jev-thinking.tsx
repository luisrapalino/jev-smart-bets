'use client';

import { useEffect, useRef } from 'react';

// El estado mas largo define el ancho de la caja (sizer), para que las
// lineas no cambien de ancho al intercambiarse.
const STATES = [
  'Interpretando tu solicitud',
  'Analizando cuotas en vivo',
  'Armando tu boleto',
];
const LONGEST = STATES.reduce((a, b) => (a.length >= b.length ? a : b));

function readMs(name: string, fallback: number): number {
  const value = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  );
  return Number.isFinite(value) ? value : fallback;
}

export function JevThinking() {
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Las lineas se crean de forma imperativa (no via React) para que el
    // ciclo pueda removerlas sin pelear con la reconciliacion.
    const first = document.createElement('span');
    first.className = 't-think-text';
    first.textContent = STATES[0];
    first.setAttribute('data-text', STATES[0]);
    box.appendChild(first);

    let live = first;
    let index = 0;
    let cancelled = false;
    const timers: number[] = [];

    function cycle() {
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;

          const swap = readMs('--think-swap', 150);
          const gap = readMs('--think-gap', 50);
          const leaving = live;
          index = (index + 1) % STATES.length;

          leaving.classList.add('is-exit');

          const next = document.createElement('span');
          next.className = 't-think-text is-enter-start';
          next.textContent = STATES[index];
          next.setAttribute('data-text', STATES[index]);
          box!.appendChild(next);
          live = next;

          const release = () => {
            void next.offsetWidth; // flush the enter-start rest state
            next.classList.remove('is-enter-start');
          };
          if (gap > 0) timers.push(window.setTimeout(release, gap));
          else release();

          timers.push(
            window.setTimeout(() => {
              leaving.remove();
              cycle();
            }, swap + gap)
          );
        }, readMs('--think-hold', 2000))
      );
    }
    cycle();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <span className="t-think text-sm" role="status" ref={boxRef}>
      <span className="t-think-sizer" aria-hidden="true">
        {LONGEST}
      </span>
    </span>
  );
}

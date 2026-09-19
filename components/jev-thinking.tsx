'use client';

import { useEffect, useRef } from 'react';

import { readCssTimeMs } from '@/lib/ui/css-time';

// El estado mas largo define el ancho de la caja (sizer), para que las
// lineas no cambien de ancho al intercambiarse.
const STATES = [
  'Interpretando tu solicitud',
  'Analizando cuotas en vivo',
  'Armando tu boleto',
];
const LONGEST = STATES.reduce((a, b) => (a.length >= b.length ? a : b));

export function JevThinking() {
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Las lineas se crean de forma imperativa (no via React) para que el
    // ciclo pueda removerlas sin pelear con la reconciliacion. Se lleva
    // registro de las creadas: el cleanup tiene que retirarlas o el doble
    // efecto de Strict Mode deja una linea fantasma debajo de la viva.
    const created: HTMLSpanElement[] = [];

    function createLine(text: string, className: string): HTMLSpanElement {
      const line = document.createElement('span');
      line.className = className;
      line.textContent = text;
      line.setAttribute('data-text', text);
      created.push(line);
      box!.appendChild(line);
      return line;
    }

    let live = createLine(STATES[0], 't-think-text');
    let index = 0;
    let cancelled = false;
    const timers: number[] = [];

    function cycle() {
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;

          const swap = readCssTimeMs('--think-swap', 150);
          const gap = readCssTimeMs('--think-gap', 50);
          const leaving = live;
          index = (index + 1) % STATES.length;

          leaving.classList.add('is-exit');

          const next = createLine(STATES[index], 't-think-text is-enter-start');
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
        }, readCssTimeMs('--think-hold', 2000))
      );
    }
    cycle();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      created.forEach((line) => line.remove());
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

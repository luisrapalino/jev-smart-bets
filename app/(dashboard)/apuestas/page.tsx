import { BetHistory } from '@/components/bet-history';

export const metadata = {
  title: 'Mis apuestas | Jev Smart Bets',
};

export default function BetsPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <div className="border-rule border-b px-4 py-3">
        <h2 className="board-condensed text-base font-semibold">Mis apuestas</h2>
        <p className="text-chalk-dim mt-0.5 text-xs">
          El resultado lo registras tú: la app no lo conoce, la apuesta se liquida en el
          operador.
        </p>
      </div>
      <BetHistory />
    </div>
  );
}

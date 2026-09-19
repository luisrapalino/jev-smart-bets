import { Sparkles } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="relative overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 py-6 text-white sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Jev Smart Bets</p>
            <p className="text-xs text-white/80">
              Pide una combinada en lenguaje natural, Jev arma el boleto
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/30 px-4 py-5">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-rule bg-board-raised sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-2xl items-baseline gap-3 px-4 py-2.5">
          <span className="board-condensed text-bulb text-lg font-bold tracking-tight">
            JEV SMART BETS
          </span>
          <span className="text-chalk-dim text-xs">Tablero en vivo</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

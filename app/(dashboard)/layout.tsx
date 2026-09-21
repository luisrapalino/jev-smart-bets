import { BoardNav } from '@/components/board-nav';
import { AuthWidget } from '@/components/auth-widget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Sin credenciales el proyecto sigue siendo usable, pero conviene decir
  // que lo es: los datos no se guardan y Jev responde simulado.
  const isDemo = !process.env.DATABASE_URL;
  const jevSimulated = !process.env.TYPESAFE_API_KEY;

  const demoNote = [
    !process.env.DATABASE_URL && 'las apuestas no se guardan',
    jevSimulated && 'Jev responde simulado',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-rule bg-board-raised sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <span className="board-condensed text-bulb text-lg font-bold tracking-tight">
            JEV SMART BETS
          </span>
          <BoardNav />
          <div className="ml-auto flex items-center gap-2">
            {!isDemo && <AuthWidget />}
            {(isDemo || jevSimulated) && (
              <span
                className="border-rule text-chalk-dim rounded-sm border px-1.5 py-0.5 text-[10px]"
                title={`Modo demo: ${demoNote}. Configura .env.local para usar datos reales.`}
              >
                demo
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

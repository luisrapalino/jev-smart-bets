import { Sparkles } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-border sticky top-0 z-30 flex items-center gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <Sparkles className="text-primary size-5" />
        <span className="font-semibold">Jev Smart Bets</span>
        <span className="text-muted-foreground ml-auto text-xs">
          Asistente de apuestas con IA
        </span>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}

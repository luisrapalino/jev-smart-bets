import { cn } from '@/lib/utils';

// Insignias generadas (iniciales + gradiente determinista por nombre de
// equipo), al estilo Slack/GitHub. No hay proveedor de datos deportivos
// gratuito que incluya escudos reales con licencia -- The Odds API solo
// da nombres y cuotas -- asi que esto evita usar marcas de terceros sin
// autorizacion mientras se mantiene un resultado visual consistente.
const GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-amber-500 to-yellow-400',
  'from-lime-500 to-green-400',
  'from-emerald-500 to-teal-400',
  'from-cyan-500 to-sky-400',
  'from-blue-500 to-indigo-400',
  'from-violet-500 to-purple-400',
  'from-fuchsia-500 to-pink-400',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
} as const;

export function TeamBadge({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-sm ring-2 ring-white/40',
        gradient,
        SIZE_CLASSES[size],
        className
      )}
      title={name}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

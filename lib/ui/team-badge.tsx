import { cn } from '@/lib/utils';

// Insignias generadas (iniciales + color determinista por nombre). No
// hay proveedor gratuito que entregue escudos reales con licencia, asi
// que esto evita usar marcas de terceros. Los tonos son apagados a
// proposito: en el tablero, lo mas brillante tiene que ser el precio.
const TONES = [
  '#5c6f6a', // pizarra verde
  '#6b5a4e', // arcilla
  '#4f5a6b', // acero
  '#6b5f45', // oliva
  '#63515f', // ciruela
  '#6b544a', // oxido
  '#4a5f5c', // verde mar
  '#585b6b', // indigo apagado
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
  sm: 'size-5 text-[9px]',
  md: 'size-7 text-[10px]',
  lg: 'size-10 text-xs',
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
  const tone = TONES[hashString(name) % TONES.length];

  return (
    <div
      className={cn(
        'text-chalk flex shrink-0 items-center justify-center rounded-sm font-semibold',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: tone }}
      title={name}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

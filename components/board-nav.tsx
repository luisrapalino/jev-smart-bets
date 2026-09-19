'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Tablero' },
  { href: '/apuestas', label: 'Mis apuestas' },
];

export function BoardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-sm px-2 py-1 text-xs transition-[color,background-color] duration-150 ease-out',
              isActive ? 'text-bulb bg-accent' : 'text-chalk-dim hover:bg-accent'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

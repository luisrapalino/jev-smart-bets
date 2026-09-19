import { Crown, Shield, Trophy, type LucideIcon } from 'lucide-react';

interface LeagueMeta {
  icon: LucideIcon;
  gradient: string;
}

const DEFAULT_META: LeagueMeta = { icon: Trophy, gradient: 'from-slate-600 to-slate-500' };

const LEAGUE_META: Record<string, LeagueMeta> = {
  'UEFA Champions League': { icon: Trophy, gradient: 'from-indigo-600 to-blue-500' },
  'Premier League': { icon: Crown, gradient: 'from-purple-600 to-fuchsia-500' },
  'La Liga': { icon: Shield, gradient: 'from-red-600 to-orange-500' },
};

export function getLeagueMeta(league: string): LeagueMeta {
  return LEAGUE_META[league] ?? DEFAULT_META;
}

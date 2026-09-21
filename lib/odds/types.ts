export interface OddsSelection {
  label: string; // ej. '1', 'X', '2'
  odds: number;
  // Cuota justa estimada (de-vigueada) y el edge de `odds` sobre ella.
  // Ausentes cuando no hay suficientes libros para estimarla con
  // confianza (ver lib/odds/value.ts).
  fairOdds?: number;
  edgePct?: number;
}

export interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601
  isLive: boolean;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  market1x2: OddsSelection[];
  trend: 'up' | 'down' | 'stable';
}

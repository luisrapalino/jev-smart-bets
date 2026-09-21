/**
 * Deteccion de valor (+EV): comparar la mejor cuota disponible contra una
 * probabilidad "justa" estimada de-vigueando la linea de un libro de
 * referencia (Pinnacle, el estandar de la industria por su margen bajo).
 * Si la cuota ofrecida paga mas de lo que esa probabilidad implica, hay
 * valor esperado a favor del apostador.
 */

// Umbral minimo para marcar una cuota como "de valor" en la UI. Por
// debajo de esto el margen de redondeo/actualizacion entre libros genera
// falsos positivos constantes.
export const MIN_VALUE_EDGE_PCT = 3;

// Por encima de esto no se calcula edge: el de-vig proporcional asume
// que el margen de cada libro se reparte parejo entre resultados, pero
// en longshots reales el margen se concentra ahi ("favorite-longshot
// bias", documentado en la literatura de apuestas deportivas desde los
// 70s). La probabilidad justa que sale de este metodo para un longshot
// queda sobreestimada, y el "valor" que parece haber es en buena parte
// artefacto del metodo, no edge real.
export const MAX_ODDS_FOR_VALUE = 8;

/**
 * Quita el margen de la casa (overround) de un set de cuotas 1X2 con el
 * metodo proporcional: la probabilidad implicita de cada resultado se
 * normaliza para que las tres sumen 1.
 */
export function devigProbabilities(odds: number[]): number[] {
  const implied = odds.map((o) => 1 / o);
  const overround = implied.reduce((a, b) => a + b, 0);
  return implied.map((p) => p / overround);
}

export interface EdgeResult {
  fairOdds: number;
  edgePct: number;
}

/**
 * edgePct > 0 significa que `offeredOdds` paga mas que la cuota justa
 * derivada de `fairProbability`.
 */
export function computeEdge(offeredOdds: number, fairProbability: number): EdgeResult {
  const fairOdds = 1 / fairProbability;
  const edgePct = (offeredOdds / fairOdds - 1) * 100;
  return { fairOdds, edgePct };
}

export function isValueBet(edgePct: number | undefined): edgePct is number {
  return edgePct !== undefined && edgePct >= MIN_VALUE_EDGE_PCT;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Lee un token de duracion del :root en milisegundos.
 *
 * El helper que traen los snippets de transitions.dev hace
 * `parseFloat(getPropertyValue(name))` asumiendo ms, pero Lightning CSS
 * (el bundler de Tailwind v4) minifica los valores a su forma mas corta:
 * `500ms` se compila a `.5s` y `2000ms` a `2s`, mientras `70ms` se queda
 * igual. Con parseFloat a secas, esas duraciones se leian como 0.5 y 2,
 * de modo que las animaciones se cortaban de inmediato.
 */
export function readCssTimeMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;

  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;

  return raw.endsWith('ms') ? value : value * 1000;
}

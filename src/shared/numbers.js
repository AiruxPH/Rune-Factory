// The first prototype deliberately has a finite numeric ceiling.
// A replaceable boundary keeps a future large-number library out of gameplay code.
export const MAX_AMOUNT = 1e100;
export const amount = value => typeof value === 'number' && Number.isFinite(value) ? Math.min(MAX_AMOUNT, Math.max(0, value)) : 0;
export function format(value) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1e12) return value.toExponential(2);
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(value < 100 ? 1 : 0);
}
export function seededRandom(seed = 1) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}

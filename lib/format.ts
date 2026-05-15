const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/** Full COP amount, e.g. $18.450.000.000 */
export function formatCOP(value: number): string {
  return copFormatter.format(value);
}

/** Plain number with thousands separators (no $), for chart axes */
export function formatNum(value: number): string {
  return numFormatter.format(value);
}

/** Percentage with fixed decimals */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

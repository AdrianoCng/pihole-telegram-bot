const countFormatter = new Intl.NumberFormat("en-GB");

export function formatCount(value) {
  return countFormatter.format(value);
}

export function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

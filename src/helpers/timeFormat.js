const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function plural(value, unit) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/** Relative age of a Unix timestamp in seconds, or "unknown" when invalid. */
export function formatAge(timestamp, nowMs) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp) || timestamp <= 0) {
    return "unknown";
  }

  const ageMs = nowMs - timestamp * 1000;

  if (ageMs < 0) return "unknown";
  if (ageMs < MINUTE_MS) return "just now";
  if (ageMs < HOUR_MS) return plural(Math.floor(ageMs / MINUTE_MS), "minute");
  if (ageMs < DAY_MS) return plural(Math.floor(ageMs / HOUR_MS), "hour");
  return plural(Math.floor(ageMs / DAY_MS), "day");
}

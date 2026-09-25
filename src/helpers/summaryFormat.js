const countFormatter = new Intl.NumberFormat("en-GB");

const STATUS_LINES = {
  active: "🟢 Pi-hole is active",
  disabled: "🔴 Pi-hole blocking is disabled",
  unavailable: "🟠 Pi-hole status is unavailable",
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatCount(value) {
  return countFormatter.format(value);
}

export function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

function plural(value, unit) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/** Relative age of a Unix timestamp in seconds, or "unknown" when invalid. */
export function formatGravityAge(timestamp, nowMs) {
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

export function renderSummary(model, nowMs) {
  const { queries } = model;
  const cachedPercentage = queries.total === 0 ? 0 : (queries.cached / queries.total) * 100;

  const lines = [
    STATUS_LINES[model.blockingState] ?? STATUS_LINES.unavailable,
    "",
    `Queries: ${formatCount(queries.total)}`,
    `Blocked: ${formatCount(queries.blocked)} (${formatPercentage(queries.percentBlocked)})`,
    `Cached: ${formatCount(queries.cached)} (${formatPercentage(cachedPercentage)})`,
    `Forwarded: ${formatCount(queries.forwarded)}`,
    `Active clients: ${formatCount(model.activeClients)}`,
    `Gravity domains: ${formatCount(model.gravityDomains)}`,
    `Gravity updated: ${formatGravityAge(model.gravityLastUpdate, nowMs)}`,
  ];

  if (model.messageCount > 0) {
    lines.push("", `⚠️ Pi-hole messages: ${formatCount(model.messageCount)}`);
  }

  return lines.join("\n");
}

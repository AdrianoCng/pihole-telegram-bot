const numberFormat = new Intl.NumberFormat("en-GB");

const STATUS_LINES = {
  active: "🟢 Pi-hole is active",
  disabled: "🔴 Pi-hole blocking is disabled",
  unavailable: "🟠 Pi-hole status is unavailable",
};

export function formatCount(value) {
  return numberFormat.format(value);
}

export function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

function plural(value, unit) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/** Relative age of a Unix timestamp in seconds; invalid or future values are unknown. */
export function formatGravityAge(timestamp, nowMs) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp) || timestamp <= 0) {
    return "unknown";
  }

  const seconds = Math.floor((nowMs - timestamp * 1000) / 1000);

  if (seconds < 0) return "unknown";
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");

  return plural(Math.floor(hours / 24), "day");
}

/** Render the summary domain model as plain Telegram text. */
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

import { formatCount, formatPercentage } from "./numberFormat.js";
import { formatAge } from "./timeFormat.js";

const STATUS_LINES = {
  active: "🟢 Pi-hole is active",
  disabled: "🔴 Pi-hole blocking is disabled",
  unavailable: "🟠 Pi-hole status is unavailable",
};

export function renderSummary(model, nowMs) {
  const { queries } = model;
  const cachedPercentage = queries.total === 0 ? 0 : (queries.cached / queries.total) * 100;
  const forwardedPercentage = queries.total === 0 ? 0 : (queries.forwarded / queries.total) * 100;

  const lines = [
    STATUS_LINES[model.blockingState] ?? STATUS_LINES.unavailable,
    "",
    `Queries: ${formatCount(queries.total)}`,
    `Blocked: ${formatCount(queries.blocked)} (${formatPercentage(queries.percentBlocked)})`,
    `Cached: ${formatCount(queries.cached)} (${formatPercentage(cachedPercentage)})`,
    `Forwarded: ${formatCount(queries.forwarded)} (${formatPercentage(forwardedPercentage)})`,
    `Active clients: ${formatCount(model.activeClients)}`,
    `Gravity domains: ${formatCount(model.gravityDomains)}`,
    `Gravity updated: ${formatAge(model.gravityLastUpdate, nowMs)}`,
  ];

  if (model.messageCount > 0) {
    lines.push("", `⚠️ Pi-hole messages: ${formatCount(model.messageCount)}`);
  }

  return lines.join("\n");
}

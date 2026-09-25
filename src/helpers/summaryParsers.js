import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";

function invalid() {
  return new PiholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE);
}

function requireCount(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw invalid();
  }
  return value;
}

function requirePercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw invalid();
  }
  return value;
}

/** Validate GET /stats/summary. Never coerces, defaults, or reuses values. */
export function parseSummaryResponse(payload) {
  const { queries, clients, gravity } = payload ?? {};

  return {
    queries: {
      total: requireCount(queries?.total),
      blocked: requireCount(queries?.blocked),
      percentBlocked: requirePercentage(queries?.percent_blocked),
      cached: requireCount(queries?.cached),
      forwarded: requireCount(queries?.forwarded),
    },
    activeClients: requireCount(clients?.active),
    gravityDomains: requireCount(gravity?.domains_being_blocked),
    gravityLastUpdate: gravity?.last_update,
  };
}

/** Map GET /dns/blocking's string enum. Deliberately avoids truthiness. */
export function parseBlockingState(payload) {
  switch (payload?.blocking) {
    case "enabled":
      return "active";
    case "disabled":
      return "disabled";
    default:
      return "unavailable";
  }
}

/** Validate GET /info/messages/count. */
export function parseMessageCount(payload) {
  return requireCount(payload?.count);
}

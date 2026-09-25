import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";

function invalidResponse() {
  return new PiholeError(
    PIHOLE_ERROR_CODES.INVALID_RESPONSE,
    "Pi-hole returned an invalid response"
  );
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function requireCount(value) {
  if (!isCount(value)) throw invalidResponse();
  return value;
}

function requirePercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw invalidResponse();
  }
  return value;
}

/** Validate the required /stats/summary payload. Never coerces or defaults. */
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

/** Map the /dns/blocking string enum. Truthiness is deliberately not used. */
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

export function parseMessageCount(payload) {
  return requireCount(payload?.count);
}

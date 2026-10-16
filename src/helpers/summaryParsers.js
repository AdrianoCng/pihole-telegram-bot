import { requireCount, requirePercentage } from "../shared/validators.js";

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

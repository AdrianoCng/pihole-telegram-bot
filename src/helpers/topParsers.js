import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "../constants/top.js";
import { requireArray, requireCount, requireString } from "../shared/validators.js";

/** Validate the /stats/top_domains payload, capped at the requested count. */
export function parseTopDomains(payload) {
  return requireArray(payload?.domains)
    .slice(0, TOP_BLOCKED_DOMAINS_COUNT)
    .map((entry) => ({
      domain: requireString(entry?.domain),
      count: requireCount(entry?.count),
    }));
}

/** Validate the /stats/top_clients payload, capped at the requested count. */
export function parseTopClients(payload) {
  return requireArray(payload?.clients)
    .slice(0, TOP_CLIENTS_COUNT)
    .map((entry) => ({
      ip: requireString(entry?.ip),
      name: typeof entry?.name === "string" ? entry.name : "",
      count: requireCount(entry?.count),
    }));
}

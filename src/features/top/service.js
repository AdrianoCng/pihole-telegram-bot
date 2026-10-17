import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedGet } from "../../pihole/session.js";
import { optional } from "../../shared/optional.js";
import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "./constants.js";
import { parseTopClients, parseTopDomains } from "./parse.js";

/**
 * Read top blocked domains and top clients concurrently. Either section may be
 * null when its read fails; reject only when both fail.
 */
export async function getTop() {
  const { TOP_DOMAINS, TOP_CLIENTS } = API_ENDPOINTS.STATS;
  const [domains, clients] = await Promise.allSettled([
    authenticatedGet(`${TOP_DOMAINS}?blocked=true&count=${TOP_BLOCKED_DOMAINS_COUNT}`),
    authenticatedGet(`${TOP_CLIENTS}?count=${TOP_CLIENTS_COUNT}`),
  ]);

  const errors = [];
  const fallback = (error) => {
    errors.push(error);
    return null;
  };

  const topDomains = optional(domains, {
    parse: parseTopDomains,
    fallback,
    operation: "top-domains",
    path: TOP_DOMAINS,
  });
  const topClients = optional(clients, {
    parse: parseTopClients,
    fallback,
    operation: "top-clients",
    path: TOP_CLIENTS,
  });

  if (topDomains === null && topClients === null) throw errors[0];

  return { topDomains, topClients };
}

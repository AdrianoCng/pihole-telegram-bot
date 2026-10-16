import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedGet } from "../../pihole/session.js";
import { RECENT_BLOCKED_COUNT } from "./constants.js";
import { parseRecentBlocked } from "./parse.js";

/**
 * Read the most recent blocked queries, newest first. An optional
 * `{ param, value }` filter adds one URL-encoded query parameter.
 */
export async function getRecentBlocked(filter) {
  const query = new URLSearchParams({
    upstream: "blocklist",
    length: String(RECENT_BLOCKED_COUNT),
  });
  if (filter) query.set(filter.param, filter.value);

  const response = await authenticatedGet(`${API_ENDPOINTS.QUERIES}?${query}`);
  return parseRecentBlocked(response);
}

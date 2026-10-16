import { RECENT_BLOCKED_COUNT } from "../constants/recent.js";
import { requireArray, requireString, requireTimestamp } from "../shared/validators.js";

/** Validate the blocked /queries payload, capped at the requested count. */
export function parseRecentBlocked(payload) {
  return requireArray(payload?.queries)
    .slice(0, RECENT_BLOCKED_COUNT)
    .map((entry) => ({
      domain: requireString(entry?.domain),
      time: requireTimestamp(entry?.time),
      ip: requireString(entry?.client?.ip),
      name: typeof entry?.client?.name === "string" ? entry.client.name : "",
    }));
}

import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedGet } from "../../pihole/session.js";
import { optional } from "../../shared/optional.js";
import { parseBlockingState, parseMessageCount, parseSummaryResponse } from "./parse.js";

export async function getSummary() {
  const [summary, blocking, count] = await Promise.allSettled([
    authenticatedGet(API_ENDPOINTS.STATS.SUMMARY),
    authenticatedGet(API_ENDPOINTS.DNS.BLOCKING),
    authenticatedGet(API_ENDPOINTS.INFO.MESSAGES_COUNT),
  ]);

  if (summary.status === "rejected") throw summary.reason;

  return {
    ...parseSummaryResponse(summary.value),
    blockingState: optional(blocking, {
      parse: parseBlockingState,
      fallback: () => "unavailable",
      operation: "blocking",
      path: API_ENDPOINTS.DNS.BLOCKING,
    }),
    messageCount: optional(count, {
      parse: parseMessageCount,
      fallback: () => null,
      operation: "messages-count",
      path: API_ENDPOINTS.INFO.MESSAGES_COUNT,
    }),
  };
}

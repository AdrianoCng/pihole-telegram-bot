export const API_ENDPOINTS = {
  AUTH: "/auth",
  STATS: {
    SUMMARY: "/stats/summary",
  },
  DNS: {
    BLOCKING: "/dns/blocking",
  },
  INFO: {
    MESSAGES: "/info/messages",
    MESSAGES_COUNT: "/info/messages/count",
  },
};

/** Upper bound for each individual Pi-hole request, including authentication. */
export const REQUEST_TIMEOUT_MS = 3000;

/** Upper bound for a whole /summary invocation, including authentication and retries. */
export const SUMMARY_DEADLINE_MS = 5000;

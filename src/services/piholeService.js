import { API_ENDPOINTS, SUMMARY_DEADLINE_MS } from "../constants/api.js";
import { CLI_COMMANDS } from "../constants/cli.js";
import { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { logSafeError } from "../helpers/logSafeError.js";
import spawnPiholeCommand from "../helpers/spawnPiholeCommand.js";
import {
  parseBlockingState,
  parseMessageCount,
  parseSummaryResponse,
} from "../helpers/summaryParsers.js";
import {
  authenticatedGet,
  endSession,
  ensureSession,
  refreshSession,
} from "./piholeSession.js";

export async function authorize() {
  try {
    await refreshSession();
    return true;
  } catch (error) {
    if (error?.code === PIHOLE_ERROR_CODES.INVALID_SESSION) return false;
    throw error;
  }
}

export async function logout({ signal } = {}) {
  await endSession({ signal });
}

export async function getMessages() {
  const response = await authenticatedGet(API_ENDPOINTS.INFO.MESSAGES);
  return Array.isArray(response?.messages) ? response.messages : null;
}

/**
 * Parse a settled supplementary read. If the read was rejected or the parse
 * throws, log a safe diagnostic and return `fallback(error)`.
 */
function optional(result, { parse, fallback, operation, path }) {
  const fail = (error) => {
    logSafeError({ operation, path, error });
    return fallback(error);
  };

  if (result.status === "rejected") return fail(result.reason);

  try {
    return parse(result.value);
  } catch (error) {
    return fail(error);
  }
}

export async function getSummary({ deadlineMs = SUMMARY_DEADLINE_MS } = {}) {
  const signal = AbortSignal.timeout(deadlineMs);

  const [summary, blocking, count] = await Promise.allSettled([
    authenticatedGet(API_ENDPOINTS.STATS.SUMMARY, { signal }),
    authenticatedGet(API_ENDPOINTS.DNS.BLOCKING, { signal }),
    authenticatedGet(API_ENDPOINTS.INFO.MESSAGES_COUNT, { signal }),
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

export function getStatus(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.STATUS], onOutput);
}

export function enable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.ENABLE], onOutput);
}

export function disable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE], onOutput);
}

export function getVersion(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.VERSION], onOutput);
}

export function update(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPDATE], onOutput);
}

export function updateGravity(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPGRAVITY], onOutput);
}

export default {
  authorize,
  logout,
  getMessages,
  getSummary,
  getStatus,
  enable,
  disable,
  getVersion,
  update,
  updateGravity,
};

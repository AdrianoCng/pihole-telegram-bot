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
    if (error?.code === PIHOLE_ERROR_CODES.INVALID_SESSION) {
      return false;
    }
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

/** Supplementary data degrades to a fallback instead of failing the dashboard. */
function optional(result, parse, operation, path, fallback) {
  try {
    if (result.status === "rejected") throw result.reason;
    return parse(result.value);
  } catch (error) {
    logSafeError({ operation, path, error });
    return fallback;
  }
}

export async function getSummary({ deadlineMs = SUMMARY_DEADLINE_MS } = {}) {
  const signal = AbortSignal.timeout(deadlineMs);
  await ensureSession({ signal });

  const [summary, blocking, count] = await Promise.allSettled([
    authenticatedGet(API_ENDPOINTS.STATS.SUMMARY, { signal }),
    authenticatedGet(API_ENDPOINTS.DNS.BLOCKING, { signal }),
    authenticatedGet(API_ENDPOINTS.INFO.MESSAGES_COUNT, { signal }),
  ]);

  if (summary.status === "rejected") throw summary.reason;

  return {
    ...parseSummaryResponse(summary.value),
    blockingState: optional(
      blocking, parseBlockingState, "blocking", API_ENDPOINTS.DNS.BLOCKING, "unavailable"
    ),
    messageCount: optional(
      count, parseMessageCount, "messages-count", API_ENDPOINTS.INFO.MESSAGES_COUNT, null
    ),
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

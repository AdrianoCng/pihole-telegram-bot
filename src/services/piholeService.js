import { API_ENDPOINTS } from "../constants/api.js";
import { CLI_COMMANDS } from "../constants/cli.js";
import { RECENT_BLOCKED_COUNT } from "../constants/recent.js";
import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "../constants/top.js";
import { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { logSafeError } from "../helpers/logSafeError.js";
import spawnPiholeCommand from "../helpers/spawnPiholeCommand.js";
import {
  parseBlockingState,
  parseMessageCount,
  parseSummaryResponse,
} from "../helpers/summaryParsers.js";
import { parseRecentBlocked } from "../helpers/recentParsers.js";
import { parseTopClients, parseTopDomains } from "../helpers/topParsers.js";
import { authenticatedGet, endSession, refreshSession } from "./piholeSession.js";

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

export function getStatus(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.STATUS], onOutput);
}

export function enable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.ENABLE], onOutput);
}

export function disable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE], onOutput);
}

export function pause(seconds, onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE, `${seconds}s`], onOutput);
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
  getTop,
  getRecentBlocked,
  getStatus,
  enable,
  disable,
  pause,
  getVersion,
  update,
  updateGravity,
};

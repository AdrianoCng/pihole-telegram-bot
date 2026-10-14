import { isIP } from "node:net";

const DOMAIN_KEYWORD = "domain";
const NAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,252}$/;

function parseClient(token) {
  // isIP accepts IPv6 zone IDs (fe80::1%eth0), which are rejected here.
  if (token.includes("%")) return null;
  if (isIP(token)) return { type: "client", param: "client_ip", value: token };
  if (NAME_PATTERN.test(token)) return { type: "client", param: "client_name", value: token };
  return null;
}

function parseDomain(token) {
  const value = token.toLowerCase().replace(/\.$/, "");
  return NAME_PATTERN.test(value) ? { type: "domain", param: "domain", value } : null;
}

/**
 * Parse the /recent payload into a filter, or null when it is invalid.
 * Accepts nothing, a client IP or hostname, or `domain <domain>`.
 */
export function parseRecentFilter(payload) {
  const tokens = (payload ?? "").trim().split(/\s+/).filter(Boolean);
  const isKeyword = (token) => token.toLowerCase() === DOMAIN_KEYWORD;

  if (tokens.length === 0) return { type: "all" };
  if (tokens.length === 1) return isKeyword(tokens[0]) ? null : parseClient(tokens[0]);
  if (tokens.length === 2 && isKeyword(tokens[0])) return parseDomain(tokens[1]);
  return null;
}

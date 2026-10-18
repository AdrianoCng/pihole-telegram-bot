import { PiholeError, PIHOLE_ERROR_CODES } from "../../shared/errors/PiholeError.js";
import { invalidResponse, requireArray, requireString } from "../../shared/validators.js";
import { DOMAIN_KINDS, DOMAIN_LISTS } from "./constants.js";

const WILDCARD_PREFIX = "*.";
const DOMAIN_MAX_LENGTH = 253;
const LABEL_PATTERN = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;
const DUPLICATE_ERROR = /already present|UNIQUE constraint/i;
const WILDCARD_REGEX = /^\(\\\.\|\^\)(.+)\$$/;
const LIST_TYPES = new Set(Object.values(DOMAIN_LISTS).map((list) => list.type));
const KINDS = new Set(Object.values(DOMAIN_KINDS));

function isHostname(value) {
  const labels = value.split(".");
  return value.length <= DOMAIN_MAX_LENGTH && labels.every((label) => LABEL_PATTERN.test(label));
}

/** The regex Pi-hole's web interface stores for a wildcard entry. */
function wildcardRegex(domain) {
  return `(\\.|^)${domain.replaceAll(".", "\\.")}$`;
}

function requireOneOf(values, value) {
  if (!values.has(value)) throw invalidResponse();
  return value;
}

/**
 * Parse the /allow or /deny payload into the entry to add, or null when it is
 * invalid. Accepts one domain, or `*.domain` to also match every subdomain.
 */
export function parseDomainTarget(payload) {
  const tokens = (payload ?? "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length !== 1) return null;

  const value = tokens[0].toLowerCase().replace(/\.$/, "");

  if (value.startsWith(WILDCARD_PREFIX)) {
    const domain = value.slice(WILDCARD_PREFIX.length);
    return isHostname(domain)
      ? { kind: DOMAIN_KINDS.REGEX, domain: wildcardRegex(domain), display: value }
      : null;
  }

  return isHostname(value) ? { kind: DOMAIN_KINDS.EXACT, domain: value, display: value } : null;
}

/** Validate the add-domain payload: "added", "exists", or a rejection. */
export function parseAddResult(payload, domain) {
  const success = requireArray(payload?.processed?.success);
  const errors = requireArray(payload?.processed?.errors);

  if (success.some((entry) => entry?.item === domain)) return "added";

  const failure = errors.find((entry) => entry?.item === domain);
  if (!failure) throw invalidResponse();
  if (DUPLICATE_ERROR.test(failure.error ?? "")) return "exists";

  throw new PiholeError({
    code: PIHOLE_ERROR_CODES.REJECTED,
    message: "Pi-hole rejected the domain",
  });
}

/** Pi-hole answers HTTP 400 when the entry is already on the list. */
export function isDuplicateError(error) {
  return (
    error instanceof PiholeError &&
    error.status === 400 &&
    error.apiError?.key === "database_error" &&
    DUPLICATE_ERROR.test(error.apiError.hint ?? "")
  );
}

/** Validate the /domains payload. */
export function parseDomains(payload) {
  return requireArray(payload?.domains).map((entry) => {
    if (typeof entry?.enabled !== "boolean") throw invalidResponse();
    return {
      domain: requireString(entry.domain),
      type: requireOneOf(LIST_TYPES, entry.type),
      kind: requireOneOf(KINDS, entry.kind),
      enabled: entry.enabled,
    };
  });
}

/** Show a wildcard regex as the `*.domain` it was added from, otherwise the raw entry. */
export function displayDomain({ kind, domain }) {
  if (kind !== DOMAIN_KINDS.REGEX) return domain;

  const match = WILDCARD_REGEX.exec(domain);
  if (!match) return domain;

  const host = match[1].replaceAll("\\.", ".");
  return isHostname(host) && wildcardRegex(host) === domain ? `${WILDCARD_PREFIX}${host}` : domain;
}

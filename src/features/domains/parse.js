import { PiholeError, PIHOLE_ERROR_CODES } from "../../shared/errors/PiholeError.js";
import { invalidResponse, requireArray } from "../../shared/validators.js";
import { DOMAIN_KINDS } from "./constants.js";

const WILDCARD_PREFIX = "*.";
const DOMAIN_MAX_LENGTH = 253;
const LABEL_PATTERN = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;
const DUPLICATE_ERROR = /already present|UNIQUE constraint/i;

function isHostname(value) {
  const labels = value.split(".");
  return value.length <= DOMAIN_MAX_LENGTH && labels.every((label) => LABEL_PATTERN.test(label));
}

/** The regex Pi-hole's web interface stores for a wildcard entry. */
function wildcardRegex(domain) {
  return `(\\.|^)${domain.replaceAll(".", "\\.")}$`;
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

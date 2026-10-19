import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedDelete, authenticatedGet, authenticatedPost } from "../../pihole/session.js";
import { isDuplicateError, isNotFoundError, parseAddResult, parseDomains } from "./parse.js";

/** Add a domain entry to a list. Resolves "added" or "exists". */
export async function addDomain(list, { kind, domain }) {
  let response;
  try {
    response = await authenticatedPost(`${API_ENDPOINTS.DOMAINS}/${list.type}/${kind}`, {
      domain,
    });
  } catch (error) {
    if (isDuplicateError(error)) return "exists";
    throw error;
  }
  return parseAddResult(response, domain);
}

/** Remove a domain entry from a list. Resolves "removed" or "missing". */
export async function removeDomain(list, { kind, domain }) {
  try {
    await authenticatedDelete(
      `${API_ENDPOINTS.DOMAINS}/${list.type}/${kind}/${encodeURIComponent(domain)}`
    );
  } catch (error) {
    if (isNotFoundError(error)) return "missing";
    throw error;
  }
  return "removed";
}

/** Read every allow and deny entry, exact and regex. */
export async function listDomains() {
  return parseDomains(await authenticatedGet(API_ENDPOINTS.DOMAINS));
}

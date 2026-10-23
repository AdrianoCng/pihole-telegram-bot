import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedDelete, authenticatedGet, authenticatedPost } from "../../pihole/session.js";
import { SEARCH_LIMIT } from "./constants.js";
import {
  isDuplicateError,
  isNotFoundError,
  parseAddResult,
  parseDomains,
  parseGroups,
  parseSearch,
} from "./parse.js";

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

/** Find every allow/deny rule and subscribed list matching a domain. Changes nothing. */
export async function checkDomain(domain) {
  // One extra result tells parseSearch the limit was reached.
  const [search, groups] = await Promise.all([
    authenticatedGet(
      `${API_ENDPOINTS.SEARCH}/${encodeURIComponent(domain)}?partial=false&N=${SEARCH_LIMIT + 1}`
    ),
    authenticatedGet(API_ENDPOINTS.GROUPS),
  ]);
  return { domain, ...parseSearch(search), groups: parseGroups(groups) };
}

import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedGet, authenticatedPost } from "../../pihole/session.js";
import { isDuplicateError, parseAddResult, parseDomains } from "./parse.js";

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

/** Read every allow and deny entry, exact and regex. */
export async function listDomains() {
  return parseDomains(await authenticatedGet(API_ENDPOINTS.DOMAINS));
}

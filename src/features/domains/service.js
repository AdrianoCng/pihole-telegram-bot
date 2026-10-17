import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedPost } from "../../pihole/session.js";
import { parseAddResult } from "./parse.js";

/** Add a domain entry to a list. Resolves "added" or "exists". */
export async function addDomain(list, { kind, domain }) {
  const response = await authenticatedPost(`${API_ENDPOINTS.DOMAINS}/${list.type}/${kind}`, {
    domain,
  });
  return parseAddResult(response, domain);
}

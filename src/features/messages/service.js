import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import { authenticatedGet } from "../../pihole/session.js";

export async function getMessages() {
  const response = await authenticatedGet(API_ENDPOINTS.INFO.MESSAGES);
  return Array.isArray(response?.messages) ? response.messages : null;
}

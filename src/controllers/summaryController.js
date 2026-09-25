import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";
import { logSafeError } from "../helpers/logSafeError.js";
import { renderSummary } from "../helpers/summaryFormat.js";
import { API_ENDPOINTS } from "../constants/api.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";

export const SUMMARY_ERRORS = {
  AUTHENTICATION: "❌ Pi-hole authentication failed. Check the configured credentials.",
  INVALID_RESPONSE: "❌ Pi-hole returned an invalid summary response.",
  NOT_RESPONDING: "❌ Pi-hole is not responding. Try again shortly.",
  UNEXPECTED: "❌ Could not load the Pi-hole summary.",
};

const NETWORK_ERROR_NAMES = new Set(["TypeError", "TimeoutError", "AbortError"]);

function errorMessage(error) {
  if (error instanceof PiholeError) {
    if (error.status === 401 || error.code === PIHOLE_ERROR_CODES.INVALID_SESSION) {
      return SUMMARY_ERRORS.AUTHENTICATION;
    }
    if (error.code === PIHOLE_ERROR_CODES.INVALID_RESPONSE) {
      return SUMMARY_ERRORS.INVALID_RESPONSE;
    }
    return SUMMARY_ERRORS.UNEXPECTED;
  }

  if (NETWORK_ERROR_NAMES.has(error?.name)) return SUMMARY_ERRORS.NOT_RESPONDING;

  return SUMMARY_ERRORS.UNEXPECTED;
}

export async function summaryController(ctx) {
  let message;

  try {
    const summary = await piholeService.getSummary();
    message = renderSummary(summary, Date.now());
  } catch (error) {
    logSafeError({ operation: "summary", path: API_ENDPOINTS.STATS.SUMMARY, error });
    message = errorMessage(error);
  }

  try {
    await sendMessage(ctx, message);
  } catch (error) {
    logSafeError({ operation: "summary-reply", path: "telegram", error });
  }
}

export default { summaryController };

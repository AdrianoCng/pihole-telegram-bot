import piholeService from "../services/piholeService.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { sendMessage } from "../helpers/index.js";
import { logSafeError } from "../helpers/logSafeError.js";
import { renderSummary } from "../helpers/summaryFormat.js";

export const SUMMARY_ERRORS = {
  AUTHENTICATION: "❌ Pi-hole authentication failed. Check the configured credentials.",
  INVALID_RESPONSE: "❌ Pi-hole returned an invalid summary response.",
  NOT_RESPONDING: "❌ Pi-hole is not responding. Try again shortly.",
  UNEXPECTED: "❌ Could not load the Pi-hole summary.",
};

function errorMessage(error) {
  if ((error?.isApiError && error.status === 401) ||
      error?.code === PIHOLE_ERROR_CODES.INVALID_SESSION) {
    return SUMMARY_ERRORS.AUTHENTICATION;
  }
  if (error?.code === PIHOLE_ERROR_CODES.INVALID_RESPONSE) {
    return SUMMARY_ERRORS.INVALID_RESPONSE;
  }
  if (error instanceof TypeError || error?.name === "TimeoutError" || error?.name === "AbortError") {
    return SUMMARY_ERRORS.NOT_RESPONDING;
  }
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

  await sendMessage(ctx, message);
}

export default { summaryController };

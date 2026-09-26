import { ERROR_KINDS, NETWORK_ERROR_NAMES } from "../constants/errorMessages.js";
import CommandError from "./CommandError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "./PiholeError.js";

/** Map any thrown value to the kind of failure it represents. */
export function classifyError(error) {
  if (error instanceof PiholeError) {
    if (error.status === 401 || error.code === PIHOLE_ERROR_CODES.INVALID_SESSION) {
      return ERROR_KINDS.AUTHENTICATION;
    }
    if (error.code === PIHOLE_ERROR_CODES.INVALID_RESPONSE) {
      return ERROR_KINDS.INVALID_RESPONSE;
    }
    return ERROR_KINDS.REQUEST_FAILED;
  }

  if (error instanceof CommandError) return ERROR_KINDS.COMMAND_FAILED;

  if (NETWORK_ERROR_NAMES.has(error?.name)) return ERROR_KINDS.NOT_RESPONDING;

  return ERROR_KINDS.UNEXPECTED;
}

export default classifyError;

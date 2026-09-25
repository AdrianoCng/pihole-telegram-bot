/**
 * Pi-hole domain failures. Messages are static so errors are always safe to log.
 */
export const PIHOLE_ERROR_CODES = {
  INVALID_SESSION: "INVALID_SESSION",
  INVALID_RESPONSE: "INVALID_RESPONSE",
};

const MESSAGES = {
  [PIHOLE_ERROR_CODES.INVALID_SESSION]: "Pi-hole returned an invalid session",
  [PIHOLE_ERROR_CODES.INVALID_RESPONSE]: "Pi-hole returned an invalid response",
};

class PiholeError extends Error {
  name = "PiholeError";

  constructor(code) {
    super(MESSAGES[code] ?? "Pi-hole request failed");
    this.code = code;
  }
}

export default PiholeError;

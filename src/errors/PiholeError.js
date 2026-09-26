export const PIHOLE_ERROR_CODES = {
  HTTP: "HTTP",
  INVALID_SESSION: "INVALID_SESSION",
  INVALID_RESPONSE: "INVALID_RESPONSE",
};

/**
 * A failure talking to Pi-hole: an HTTP error status or an invalid payload.
 * Messages must be static strings because errors are logged in full.
 * `path` is the static endpoint that failed, when known.
 */
class PiholeError extends Error {
  constructor({code, message, status, path}) {
    super(message);
    this.name = "PiholeError";
    this.code = code;
    this.status = status;
    this.path = path;
  }
}

export default PiholeError;

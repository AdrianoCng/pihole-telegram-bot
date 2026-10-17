export const PIHOLE_ERROR_CODES = {
  HTTP: "HTTP",
  INVALID_SESSION: "INVALID_SESSION",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  REJECTED: "REJECTED",
};

/**
 * A failure talking to Pi-hole: an HTTP error status, an invalid payload, or
 * a change Pi-hole refused.
 * Messages must be static strings because errors are logged in full.
 * `path` is the static endpoint that failed, when known.
 */
export class PiholeError extends Error {
  constructor({ code, message, status, path }) {
    super(message);
    this.name = "PiholeError";
    this.code = code;
    this.status = status;
    this.path = path;
  }
}

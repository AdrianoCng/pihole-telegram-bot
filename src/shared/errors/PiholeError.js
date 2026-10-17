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
 * `apiError` holds the `key` and `hint` from Pi-hole's HTTP error body, when present.
 */
export class PiholeError extends Error {
  constructor({ code, message, status, path, apiError }) {
    super(message);
    this.name = "PiholeError";
    this.code = code;
    this.status = status;
    this.path = path;
    this.apiError = apiError;
  }
}

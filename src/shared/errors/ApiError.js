import { AppError } from "./AppError.js";

/**
 * A failure talking to Pi-hole's HTTP API.
 * `path` is the endpoint that failed, when known.
 * `apiError` holds the `key` and `hint` from Pi-hole's HTTP error body, when present.
 */
export class ApiError extends AppError {
  constructor({
    message = "Pi-hole request failed",
    code = "API",
    method,
    path,
    status,
    apiError,
    cause,
  } = {}) {
    super(message, { code, cause });
    this.method = method;
    this.path = path;
    this.status = status;
    this.apiError = apiError;
  }

  get userMessage() {
    return "❌ Pi-hole request failed.";
  }

  debugFields() {
    return {
      ...super.debugFields(),
      method: this.method,
      path: this.path,
      status: this.status,
      apiErrorKey: this.apiError?.key,
      apiErrorHint: this.apiError?.hint,
    };
  }
}

/** Pi-hole answered 401 or did not return a valid session. */
export class ApiAuthError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole authentication failed", code: "API_AUTH", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole authentication failed. Check the configured credentials.";
  }
}

/** The request never got an answer: network failure, timeout, or abort. */
export class ApiUnreachableError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole did not respond", code: "API_UNREACHABLE", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole is not responding. Try again shortly.";
  }
}

/** The body was not JSON or failed validation. */
export class ApiResponseError extends ApiError {
  constructor(options = {}) {
    super({
      message: "Pi-hole returned an invalid response",
      code: "API_INVALID_RESPONSE",
      ...options,
    });
  }

  get userMessage() {
    return "❌ Pi-hole returned an invalid response.";
  }
}

/** Pi-hole processed the request but refused the change. */
export class ApiRejectedError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole rejected the change", code: "API_REJECTED", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole rejected the change.";
  }
}

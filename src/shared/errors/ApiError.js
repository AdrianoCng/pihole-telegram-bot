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

/** Pi-hole answered 400: the request was malformed or invalid. */
export class ApiBadRequestError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole returned 400 Bad Request", code: "API_BAD_REQUEST", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole rejected the request.";
  }
}

/** Pi-hole answered 402: the request failed. */
export class ApiRequestFailedError extends ApiError {
  constructor(options = {}) {
    super({
      message: "Pi-hole returned 402 Request Failed",
      code: "API_REQUEST_FAILED",
      ...options,
    });
  }

  get userMessage() {
    return "❌ Pi-hole could not complete the request.";
  }
}

/** Pi-hole answered 403: the session is not allowed to do this. */
export class ApiForbiddenError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole returned 403 Forbidden", code: "API_FORBIDDEN", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole denied access to this action.";
  }
}

/** Pi-hole answered 404: the endpoint or entry does not exist. */
export class ApiNotFoundError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole returned 404 Not Found", code: "API_NOT_FOUND", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole could not find that resource.";
  }
}

/** Pi-hole answered 429: too many requests. */
export class ApiRateLimitError extends ApiError {
  constructor(options = {}) {
    super({
      message: "Pi-hole returned 429 Too Many Requests",
      code: "API_RATE_LIMITED",
      ...options,
    });
  }

  get userMessage() {
    return "❌ Pi-hole is rate limiting requests. Try again shortly.";
  }
}

/** Pi-hole answered with a 5xx status. */
export class ApiServerError extends ApiError {
  constructor(options = {}) {
    super({ message: "Pi-hole returned a server error", code: "API_SERVER", ...options });
  }

  get userMessage() {
    return "❌ Pi-hole hit an internal error.";
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

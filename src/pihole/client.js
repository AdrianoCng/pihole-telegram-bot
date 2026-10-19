import { env } from "../config.js";
import {
  ApiAuthError,
  ApiError,
  ApiResponseError,
  ApiUnreachableError,
} from "../shared/errors/ApiError.js";

export const api = {
  get BASE_URL() {
    return `${env.PIHOLE_URL}/api`;
  },
  headers: {},
  hasSession() {
    return typeof this.headers.sid === "string" && this.headers.sid !== "";
  },
  setSession(sid) {
    this.headers.sid = sid;
  },
  clearSession() {
    delete this.headers.sid;
  },
  async handleErrors(response, { method, path } = {}) {
    if (response.ok) return;

    const errorMessage = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Request failed",
      403: "Forbidden",
      404: "Not Found",
    };

    const ErrorClass = response.status === 401 ? ApiAuthError : ApiError;
    throw new ErrorClass({
      message: errorMessage[response.status] || "Internal Server Error",
      method,
      status: response.status,
      path,
      apiError: await this.parseApiError(response),
    });
  },
  /** Pi-hole's `error.key` and `error.hint`, or undefined when the body has neither. */
  async parseApiError(response) {
    let body;
    try {
      body = await response.json();
    } catch {
      return undefined;
    }

    const { key, hint } = body?.error ?? {};
    const apiError = {};
    if (typeof key === "string") apiError.key = key;
    if (typeof hint === "string") apiError.hint = hint;
    return Object.keys(apiError).length > 0 ? apiError : undefined;
  },
  async parseResponse(response, { method, path } = {}) {
    const contentLength = response.headers.get("Content-Length");

    if (response.status === 204 || (contentLength !== null && parseInt(contentLength, 10) === 0)) {
      return null;
    }

    try {
      return await response.json();
    } catch (error) {
      const ErrorClass = error instanceof SyntaxError ? ApiResponseError : ApiUnreachableError;
      throw new ErrorClass({ method, path, cause: error });
    }
  },
  async request(method, path, { body, signal } = {}) {
    const options = { method, headers: { ...this.headers }, signal };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${this.BASE_URL}${path}`, options);
    } catch (error) {
      throw new ApiUnreachableError({ method, path, cause: error });
    }

    await this.handleErrors(response, { method, path });

    return this.parseResponse(response, { method, path });
  },
  post(path, data, { signal } = {}) {
    return this.request("POST", path, { body: data, signal });
  },
  get(path, { signal } = {}) {
    return this.request("GET", path, { signal });
  },
  delete(path, { signal } = {}) {
    return this.request("DELETE", path, { signal });
  },
};

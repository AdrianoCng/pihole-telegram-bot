import { getEnv } from "../config.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../shared/errors/PiholeError.js";

const api = {
  get BASE_URL() {
    return `${getEnv("PIHOLE_IP")}/api`;
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
  handleErrors(response, path) {
    if (response.ok) return;

    const errorMessage = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Request failed",
      403: "Forbidden",
      404: "Not Found",
    };

    throw new PiholeError({
      code: PIHOLE_ERROR_CODES.HTTP,
      message: errorMessage[response.status] || "Internal Server Error",
      status: response.status,
      path,
    });
  },
  parseResponse(response) {
    const contentLength = response.headers.get("Content-Length");

    if (contentLength !== null && parseInt(contentLength, 10) === 0) {
      return Promise.resolve(null);
    }

    return response.json();
  },
  async request(method, path, { body, signal } = {}) {
    const options = { method, headers: { ...this.headers }, signal };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.BASE_URL}${path}`, options);

    this.handleErrors(response, path);

    return this.parseResponse(response);
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

export default api;

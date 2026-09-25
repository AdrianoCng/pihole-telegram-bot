import { getEnv } from "./helpers/config.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "./errors/PiholeError.js";

const api = {
  BASE_URL: `${getEnv("PIHOLE_IP")}/api`,
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
  handleErrors(response) {
    if (response.ok) return;

    const errorMessage = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Request failed",
      403: "Forbidden",
      404: "Not Found",
    };

    throw new PiholeError(
      PIHOLE_ERROR_CODES.HTTP,
      errorMessage[response.status] || "Internal Server Error",
      response.status
    );
  },
  parseResponse(response) {
    const contentLength = response.headers.get("Content-Length");

    if (contentLength !== null && parseInt(contentLength, 10) === 0) {
      return Promise.resolve(null);
    }

    return response.json();
  },
  async post(path, data, { signal } = {}) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...this.headers },
      signal,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
  async get(path, { signal } = {}) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      headers: { ...this.headers },
      signal,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
  async delete(path, { signal } = {}) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "DELETE",
      headers: { ...this.headers },
      signal,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
};

export default api;

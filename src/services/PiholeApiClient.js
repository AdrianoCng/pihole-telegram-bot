import ApiError from "../ApiError.js";

const DEFAULT_ERROR_MESSAGES = {
  400: "Bad Request",
  401: "Unauthorized",
  402: "Request failed",
  403: "Forbidden",
  404: "Not Found",
};

/** @implements {import('../contracts/index.js').HttpClient} */
export default class PiholeApiClient {
  #baseUrl;
  #headers;
  #fetch;
  #errorMessages;

  /**
   * @param {Object} options
   * @param {string} options.baseUrl
   * @param {typeof globalThis.fetch} [options.fetch]
   * @param {Record<number, string>} [options.errorMessages]
   */
  constructor({ baseUrl, fetch: fetchFn = globalThis.fetch, errorMessages = DEFAULT_ERROR_MESSAGES }) {
    this.#baseUrl = baseUrl;
    this.#headers = {};
    this.#fetch = fetchFn;
    this.#errorMessages = errorMessages;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setHeader(key, value) {
    this.#headers[key] = value;
  }

  /**
   * @param {string} path
   * @param {any} data
   * @returns {Promise<any>}
   */
  async post(path, data) {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", ...this.#headers },
    });

    this.#handleErrors(response);
    return this.#parseResponse(response);
  }

  /**
   * @param {string} path
   * @returns {Promise<any>}
   */
  async get(path) {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      headers: this.#headers,
    });

    this.#handleErrors(response);
    return this.#parseResponse(response);
  }

  /**
   * @param {string} path
   * @returns {Promise<any>}
   */
  async delete(path) {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: "DELETE",
      headers: this.#headers,
    });

    this.#handleErrors(response);
    return this.#parseResponse(response);
  }

  #handleErrors(response) {
    if (response.ok) return;

    throw new ApiError(
      response.status,
      this.#errorMessages[response.status] || "Internal Server Error"
    );
  }

  #parseResponse(response) {
    const contentLength = response.headers.get("Content-Length");

    if (contentLength !== null && parseInt(contentLength, 10) === 0) {
      return Promise.resolve(null);
    }

    return response.json();
  }
}

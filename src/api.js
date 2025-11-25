import ApiError from "./ApiError.js";

const api = {
  BASE_URL: `${process.env.PIHOLE_IP}/api`,
  headers: {},
  setHeader(key, value) {
    this.headers[key] = value;
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

    throw new ApiError(
      response.status,
      errorMessage[response.status] || "Internal Server Error"
    );
  },
  parseResponse(response) {
    const contentLength = response.headers.get("Content-Length");

    if (!!contentLength && parseInt(contentLength, 10) === 0) {
      return Promise.resolve(null);
    }

    return response.json();
  },
  async post(path, data) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: this.headers,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
  async get(path) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      headers: this.headers,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
  async delete(path) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "DELETE",
      headers: this.headers,
    });

    this.handleErrors(response);

    return this.parseResponse(response);
  },
};

export default api;

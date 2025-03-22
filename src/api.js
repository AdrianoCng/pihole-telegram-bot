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
  async post(path, data) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: this.headers,
    });

    this.handleErrors(response);

    return response.json();
  },
  async get(path) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      headers: this.headers,
    });

    this.handleErrors(response);

    return response.json();
  },
  async delete(path) {
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "DELETE",
      headers: this.headers,
    });

    this.handleErrors(response);

    return response;
  },
};

export default api;

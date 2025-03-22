class ApiError extends Error {
  isApiError = true;

  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default ApiError;

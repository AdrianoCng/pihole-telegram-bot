import ApiError from "../ApiError.js";

describe("ApiError", () => {
  it("carries the HTTP status and marks itself as an API error", () => {
    const error = new ApiError(401, "Unauthorized");

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Unauthorized");
    expect(error.isApiError).toBe(true);
  });
});

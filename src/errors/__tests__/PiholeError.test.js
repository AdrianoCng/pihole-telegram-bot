import PiholeError, { PIHOLE_ERROR_CODES } from "../PiholeError.js";

describe("PiholeError", () => {
  it("carries a code, a static message, and an optional HTTP status", () => {
    const error = new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Unauthorized", 401);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "PiholeError",
      code: "HTTP",
      message: "Unauthorized",
      status: 401,
    });
  });

  it("leaves the status undefined for validation errors", () => {
    const error = new PiholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE, "Invalid");

    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.status).toBeUndefined();
  });
});

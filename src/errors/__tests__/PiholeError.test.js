import PiholeError, { PIHOLE_ERROR_CODES } from "../PiholeError.js";

describe("PiholeError", () => {
  it("carries a code, a static message, and an optional HTTP status", () => {
    const error = new PiholeError({
      code: PIHOLE_ERROR_CODES.HTTP,
      message: "Unauthorized",
      status: 401,
      path: "/auth",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "PiholeError",
      code: "HTTP",
      message: "Unauthorized",
      status: 401,
      path: "/auth",
    });
  });

  it("leaves the status undefined for validation errors", () => {
    const error = new PiholeError({
      code: PIHOLE_ERROR_CODES.INVALID_RESPONSE,
      message: "Invalid",
    });

    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.status).toBeUndefined();
    expect(error.path).toBeUndefined();
  });
});

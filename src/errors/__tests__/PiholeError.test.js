import PiholeError, { PIHOLE_ERROR_CODES } from "../PiholeError.js";

describe("PiholeError", () => {
  it.each([
    [PIHOLE_ERROR_CODES.INVALID_SESSION, "Pi-hole returned an invalid session"],
    [PIHOLE_ERROR_CODES.INVALID_RESPONSE, "Pi-hole returned an invalid response"],
    ["OTHER", "Pi-hole request failed"],
  ])("uses a static message for %s", (code, message) => {
    const error = new PiholeError(code);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PiholeError");
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
  });
});

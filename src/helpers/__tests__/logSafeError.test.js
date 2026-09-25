import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { logSafeError } from "../logSafeError.js";

describe("logSafeError", () => {
  let log;

  beforeEach(() => {
    log = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  const logged = () => JSON.parse(log.mock.calls[0][1]);

  it("logs only allowlisted fields", () => {
    const error = new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Unauthorized", 401);
    error.headers = { sid: "secret-sid" };
    error.password = "test-password";

    logSafeError({ operation: "summary", path: "/stats/summary", error });

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toBe("[pihole] Request failed:");
    expect(logged()).toEqual({
      operation: "summary",
      path: "/stats/summary",
      status: 401,
      name: "PiholeError",
      code: "HTTP",
      afterRetry: false,
    });
    expect(log.mock.calls[0].join(" ")).not.toMatch(/secret-sid|test-password|Unauthorized/);
  });

  it("reports failures that followed the retry", () => {
    const error = new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Unauthorized", 401);
    error.afterRetry = true;

    logSafeError({ operation: "blocking", path: "/dns/blocking", error });

    expect(logged().afterRetry).toBe(true);
  });

  it("accepts an explicit retry flag", () => {
    logSafeError({ operation: "logout", path: "/auth", error: new Error("x"), afterRetry: true });

    expect(logged()).toEqual({ operation: "logout", path: "/auth", name: "Error", afterRetry: true });
  });

  it("omits fields a native error does not have", () => {
    logSafeError({ operation: "summary", path: "/stats/summary", error: new TypeError("fetch failed") });

    expect(logged()).toEqual({
      operation: "summary",
      path: "/stats/summary",
      name: "TypeError",
      afterRetry: false,
    });
  });

  it("tolerates a missing error", () => {
    logSafeError({ operation: "summary", path: "/stats/summary" });

    expect(logged()).toEqual({ operation: "summary", path: "/stats/summary", afterRetry: false });
  });
});

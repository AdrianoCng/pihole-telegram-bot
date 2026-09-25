import ApiError from "../../errors/ApiError.js";
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

  it("logs only allowlisted API error fields", () => {
    const error = new ApiError(401, "Unauthorized");
    error.afterRetry = true;
    error.headers = { sid: "secret-sid" };

    logSafeError({ operation: "summary", path: "/stats/summary", error });

    expect(log).toHaveBeenCalledWith("[pihole] Request failed:", {
      operation: "summary", path: "/stats/summary", afterRetry: true, status: 401, name: "Error",
    });
  });

  it("logs error codes and honours an explicit retry flag", () => {
    const error = new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION);

    logSafeError({ operation: "authenticate", path: "/auth", error, afterRetry: false });

    expect(log).toHaveBeenCalledWith("[pihole] Request failed:", {
      operation: "authenticate", path: "/auth", afterRetry: false,
      name: "PiholeError", code: PIHOLE_ERROR_CODES.INVALID_SESSION,
    });
  });

  it("never logs raw messages, payloads, or non-object errors", () => {
    const error = Object.assign(new TypeError("password=hunter2 sid=secret-sid"), {
      body: { password: "hunter2" },
    });

    logSafeError({ operation: "blocking", path: "/dns/blocking", error });
    logSafeError({ operation: "logout", path: "/auth", error: "secret-sid" });

    expect(JSON.stringify(log.mock.calls)).not.toMatch(/hunter2|secret-sid/);
    expect(log).toHaveBeenLastCalledWith("[pihole] Request failed:", {
      operation: "logout", path: "/auth", afterRetry: false,
    });
  });
});

import summaryController, { SUMMARY_ERRORS } from "../summaryController.js";
import piholeService from "../../services/piholeService.js";
import ApiError from "../../errors/ApiError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { sendMessage } from "../../helpers/index.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import { renderSummary } from "../../helpers/summaryFormat.js";
import { COMMANDS } from "../../constants/commands.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

jest.mock("../../services/piholeService.js", () => ({
  __esModule: true,
  default: { getSummary: jest.fn() },
}));
jest.mock("../../helpers/index.js");
jest.mock("../../helpers/logSafeError.js");

const MODEL = {
  blockingState: "active",
  queries: { total: 10, blocked: 1, percentBlocked: 10, cached: 2, forwarded: 7 },
  activeClients: 1,
  gravityDomains: 100,
  gravityLastUpdate: 0,
  messageCount: null,
};

describe("summaryController", () => {
  const ctx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is registered for /summary and /stats", () => {
    const entry = COMMANDS.find(({ trigger }) => trigger.includes("summary"));
    expect(entry.trigger).toEqual(["summary", "stats"]);
    expect(entry.handler).toBe(summaryController.summaryController);
  });

  it("renders the dashboard in exactly one plain-text message", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_758_700_000_000);
    piholeService.getSummary.mockResolvedValue(MODEL);

    try {
      await summaryController.summaryController(ctx);
    } finally {
      now.mockRestore();
    }

    expect(piholeService.getSummary).toHaveBeenCalledWith();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(ctx, renderSummary(MODEL, 1_758_700_000_000));
    expect(logSafeError).not.toHaveBeenCalled();
  });

  it.each([
    ["rejected credentials", new ApiError(401, "Unauthorized"), SUMMARY_ERRORS.AUTHENTICATION],
    ["an invalid session", new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION), SUMMARY_ERRORS.AUTHENTICATION],
    ["an invalid summary", new PiholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE), SUMMARY_ERRORS.INVALID_RESPONSE],
    ["a network failure", new TypeError("fetch failed"), SUMMARY_ERRORS.NOT_RESPONDING],
    ["a timeout", new DOMException("timed out", "TimeoutError"), SUMMARY_ERRORS.NOT_RESPONDING],
    ["an abort", new DOMException("aborted", "AbortError"), SUMMARY_ERRORS.NOT_RESPONDING],
    ["a server error", new ApiError(500, "Internal Server Error"), SUMMARY_ERRORS.UNEXPECTED],
    ["a missing password", new Error("Missing required environment variable: PIHOLE_PASSWORD"), SUMMARY_ERRORS.UNEXPECTED],
    ["a non-error rejection", undefined, SUMMARY_ERRORS.UNEXPECTED],
  ])("maps %s to its message without rethrowing", async (_label, error, message) => {
    piholeService.getSummary.mockRejectedValue(error);

    await expect(summaryController.summaryController(ctx)).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(ctx, message);
    expect(logSafeError).toHaveBeenCalledWith({ operation: "summary", path: "/stats/summary", error });
  });

  it("uses the exact PRD error texts", () => {
    expect(SUMMARY_ERRORS).toEqual({
      AUTHENTICATION: "❌ Pi-hole authentication failed. Check the configured credentials.",
      INVALID_RESPONSE: "❌ Pi-hole returned an invalid summary response.",
      NOT_RESPONDING: "❌ Pi-hole is not responding. Try again shortly.",
      UNEXPECTED: "❌ Could not load the Pi-hole summary.",
    });
  });
});

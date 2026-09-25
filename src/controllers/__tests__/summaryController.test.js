import { COMMANDS } from "../../constants/commands.js";
import { API_ENDPOINTS } from "../../constants/api.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { sendMessage } from "../../helpers/index.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import piholeService from "../../services/piholeService.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";
import summaryControllers, { SUMMARY_ERRORS, summaryController } from "../summaryController.js";

jest.mock("../../services/piholeService.js", () => ({
  __esModule: true,
  default: { getSummary: jest.fn() },
}));
jest.mock("../../helpers/index.js", () => ({
  sendMessage: jest.fn(),
}));
jest.mock("../../helpers/logSafeError.js");

const MODEL = {
  blockingState: "active",
  queries: { total: 10, blocked: 1, percentBlocked: 10, cached: 5, forwarded: 4 },
  activeClients: 2,
  gravityDomains: 1000,
  gravityLastUpdate: 0,
  messageCount: 3,
};

describe("summaryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is registered under /summary and /stats", () => {
    const command = COMMANDS.find(({ trigger }) => trigger.includes("summary"));

    expect(command.trigger).toEqual(["summary", "stats"]);
    expect(command.handler).toBe(summaryController);
    expect(command.description).toBe("Show Pi-hole health and activity summary");
    expect(summaryControllers.summaryController).toBe(summaryController);
  });

  it("sends the rendered dashboard in one plain-text message", async () => {
    const ctx = createMockContext();
    piholeService.getSummary.mockResolvedValue(MODEL);

    await summaryController(ctx);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(ctx, [
      "🟢 Pi-hole is active",
      "",
      "Queries: 10",
      "Blocked: 1 (10.0%)",
      "Cached: 5 (50.0%)",
      "Forwarded: 4 (40.0%)",
      "Active clients: 2",
      "Gravity domains: 1,000",
      "Gravity updated: unknown",
      "",
      "⚠️ Pi-hole messages: 3",
    ].join("\n"));
    expect(logSafeError).not.toHaveBeenCalled();
  });

  const timeout = new DOMException("The operation timed out.", "TimeoutError");
  const abort = new DOMException("This operation was aborted", "AbortError");

  it.each([
    ["rejected credentials", new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Unauthorized", 401), SUMMARY_ERRORS.AUTHENTICATION],
    ["an invalid session", new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION, "Invalid"), SUMMARY_ERRORS.AUTHENTICATION],
    ["an invalid summary", new PiholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE, "Invalid"), SUMMARY_ERRORS.INVALID_RESPONSE],
    ["a network failure", new TypeError("fetch failed"), SUMMARY_ERRORS.NOT_RESPONDING],
    ["a timeout", timeout, SUMMARY_ERRORS.NOT_RESPONDING],
    ["an abort", abort, SUMMARY_ERRORS.NOT_RESPONDING],
    ["a server error", new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Internal Server Error", 500), SUMMARY_ERRORS.UNEXPECTED],
    ["a missing password", new Error("Missing required environment variable: PIHOLE_PASSWORD"), SUMMARY_ERRORS.UNEXPECTED],
    ["a non-error rejection", undefined, SUMMARY_ERRORS.UNEXPECTED],
  ])("replies once to %s without rethrowing", async (_case, error, expected) => {
    const ctx = createMockContext();
    piholeService.getSummary.mockRejectedValue(error);

    await expect(summaryController(ctx)).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(ctx, expected);
    expect(logSafeError).toHaveBeenCalledWith({
      operation: "summary",
      path: API_ENDPOINTS.STATS.SUMMARY,
      error,
    });
  });

  it("uses the exact PRD error messages", () => {
    expect(SUMMARY_ERRORS).toEqual({
      AUTHENTICATION: "❌ Pi-hole authentication failed. Check the configured credentials.",
      INVALID_RESPONSE: "❌ Pi-hole returned an invalid summary response.",
      NOT_RESPONDING: "❌ Pi-hole is not responding. Try again shortly.",
      UNEXPECTED: "❌ Could not load the Pi-hole summary.",
    });
  });

  it("logs a failed Telegram reply instead of rethrowing", async () => {
    const error = new Error("Telegram unavailable");
    piholeService.getSummary.mockResolvedValue(MODEL);
    sendMessage.mockRejectedValue(error);

    await expect(summaryController(createMockContext())).resolves.toBeUndefined();

    expect(logSafeError).toHaveBeenCalledWith({ operation: "summary-reply", path: "telegram", error });
  });
});

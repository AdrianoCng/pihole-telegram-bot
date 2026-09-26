import { COMMANDS } from "../../constants/commands.js";
import { sendMessage } from "../../helpers/index.js";
import piholeService from "../../services/piholeService.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";
import summaryControllers, { summaryController } from "../summaryController.js";

jest.mock("../../services/piholeService.js", () => ({
  __esModule: true,
  default: { getSummary: jest.fn() },
}));
jest.mock("../../helpers/index.js", () => ({
  sendMessage: jest.fn(),
}));

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
  });

  it("propagates service failures to the central error boundary", async () => {
    const error = new Error("summary failed");
    piholeService.getSummary.mockRejectedValue(error);

    await expect(summaryController(createMockContext())).rejects.toBe(error);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("awaits and propagates a failed Telegram reply", async () => {
    const error = new Error("Telegram unavailable");
    piholeService.getSummary.mockResolvedValue(MODEL);
    sendMessage.mockRejectedValue(error);

    await expect(summaryController(createMockContext())).rejects.toBe(error);
  });
});

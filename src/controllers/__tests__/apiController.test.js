import apiController from "../apiController.js";
import piholeService from "../../services/piholeService.js";
import { sendMessage } from "../../helpers/index.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

jest.mock("../../services/piholeService.js", () => ({
  __esModule: true,
  default: {
    authorize: jest.fn(),
    logout: jest.fn(),
    getMessages: jest.fn(),
  },
}));
jest.mock("../../helpers/index.js");

describe("API controllers", () => {
  const ctx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports successful authorization", async () => {
    piholeService.authorize.mockResolvedValue(true);

    await apiController.authorizeController(ctx);

    expect(piholeService.authorize).toHaveBeenCalledWith();
    expect(sendMessage).toHaveBeenCalledWith(ctx, "✅ Authorized successfully");
  });

  it("reports an invalid authorization response", async () => {
    piholeService.authorize.mockResolvedValue(false);

    await apiController.authorizeController(ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      ctx,
      "❌ Authorization failed: Invalid response from server"
    );
  });

  it("logs out before confirming success", async () => {
    await apiController.logoutController(ctx);

    expect(piholeService.logout).toHaveBeenCalledWith();
    expect(sendMessage).toHaveBeenCalledWith(ctx, "✅ Logged out successfully");
  });

  it("does not confirm logout when the service fails", async () => {
    piholeService.logout.mockRejectedValue(new Error("logout failed"));

    await expect(apiController.logoutController(ctx)).rejects.toThrow("logout failed");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("formats Pi-hole messages for Telegram", async () => {
    piholeService.getMessages.mockResolvedValue([
      { timestamp: 1609459200, plain: "Test message" },
    ]);

    await apiController.messagesController(ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      ctx,
      `${new Date(1609459200000).toLocaleString()} - Test message`
    );
  });

  it("reports when Pi-hole has no messages", async () => {
    piholeService.getMessages.mockResolvedValue([]);

    await apiController.messagesController(ctx);

    expect(sendMessage).toHaveBeenCalledWith(ctx, "No messages found");
  });

  it("reports an invalid messages response", async () => {
    piholeService.getMessages.mockResolvedValue(null);

    await apiController.messagesController(ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      ctx,
      "❌ Failed to retrieve messages: Invalid response from server"
    );
  });
});

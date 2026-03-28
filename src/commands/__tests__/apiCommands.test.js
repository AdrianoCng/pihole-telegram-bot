import createAuthorizeCommand from "../authorize.js";
import createLogoutCommand from "../logout.js";
import createMessagesCommand from "../messages.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("API Commands", () => {
  let mockHttpClient;
  let mockSender;
  let mockConfig;
  let ctx;

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      setHeader: jest.fn(),
    };
    mockSender = { send: jest.fn() };
    mockConfig = { get: jest.fn() };
    ctx = createMockContext();
  });

  describe("authorize", () => {
    let command;

    beforeEach(() => {
      mockConfig.get.mockReturnValue("test-password");
      command = createAuthorizeCommand({
        httpClient: mockHttpClient,
        messageSender: mockSender,
        config: mockConfig,
      });
    });

    it("has correct trigger and description", () => {
      expect(command.trigger).toEqual(["authorize", "a"]);
      expect(command.description).toBe("Authorize the bot");
    });

    it("authorizes successfully and sets header", async () => {
      mockHttpClient.post.mockResolvedValue({
        session: { sid: "test-sid" },
      });

      await command.handler(ctx);

      expect(mockHttpClient.post).toHaveBeenCalledWith("/auth", {
        password: "test-password",
      });
      expect(mockHttpClient.setHeader).toHaveBeenCalledWith("sid", "test-sid");
      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "✅ Authorized successfully"
      );
    });

    it("handles null response", async () => {
      mockHttpClient.post.mockResolvedValue(null);

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "❌ Authorization failed: Invalid response from server"
      );
    });

    it("handles response without session", async () => {
      mockHttpClient.post.mockResolvedValue({});

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "❌ Authorization failed: Invalid response from server"
      );
    });

    it("handles response without sid", async () => {
      mockHttpClient.post.mockResolvedValue({ session: {} });

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "❌ Authorization failed: Invalid response from server"
      );
    });
  });

  describe("logout", () => {
    let command;

    beforeEach(() => {
      command = createLogoutCommand({
        httpClient: mockHttpClient,
        messageSender: mockSender,
      });
    });

    it("has correct trigger and description", () => {
      expect(command.trigger).toEqual(["logout", "logoff"]);
    });

    it("calls delete on auth endpoint and sends success message", async () => {
      mockHttpClient.delete.mockResolvedValue(null);

      await command.handler(ctx);

      expect(mockHttpClient.delete).toHaveBeenCalledWith("/auth");
      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "✅ Logged out successfully"
      );
    });
  });

  describe("messages", () => {
    let command;

    beforeEach(() => {
      command = createMessagesCommand({
        httpClient: mockHttpClient,
        messageSender: mockSender,
      });
    });

    it("has correct trigger and description", () => {
      expect(command.trigger).toEqual(["messages", "m"]);
    });

    it("displays formatted messages", async () => {
      const timestamp = new Date("2024-01-15T10:30:00Z").getTime() / 1000;
      mockHttpClient.get.mockResolvedValue({
        messages: [{ timestamp, plain: "Test message" }],
      });

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        expect.stringContaining("Test message")
      );
    });

    it("handles empty messages array", async () => {
      mockHttpClient.get.mockResolvedValue({ messages: [] });

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(ctx, "No messages found");
    });

    it("handles null response", async () => {
      mockHttpClient.get.mockResolvedValue(null);

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "❌ Failed to retrieve messages: Invalid response from server"
      );
    });

    it("handles response without messages property", async () => {
      mockHttpClient.get.mockResolvedValue({});

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "❌ Failed to retrieve messages: Invalid response from server"
      );
    });
  });
});

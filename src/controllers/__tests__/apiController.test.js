import apiController from "../apiController.js";
import api from "../../api.js";
import { sendMessage } from "../../helpers/index.js";
import { API_ENDPOINTS } from "../../constants/api";
import { createMockContext } from "../../__tests__/helpers/testUtils";

jest.mock("../../api.js", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn(), delete: jest.fn(), setHeader: jest.fn() } }));
jest.mock("../../helpers/index.js");

describe("API Controllers", () => {
  const mockCtx = createMockContext();
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv, PIHOLE_PASSWORD: "test-password" }; });
  afterEach(() => { process.env = originalEnv; });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authorize Controller", () => {
    it("rejects a missing password before making a request", async () => {
      delete process.env.PIHOLE_PASSWORD;
      await expect(apiController.authorizeController(mockCtx)).rejects.toThrow(
        "Missing required environment variable: PIHOLE_PASSWORD"
      );
      expect(api.post).not.toHaveBeenCalled();
    });

    it("Should authorize the user", async () => {
      const mockResponse = {
        session: {
          sid: "test-sid",
        },
      };

      api.post.mockResolvedValueOnce(mockResponse);

      await apiController.authorizeController(mockCtx);

      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH, {
        password: process.env.PIHOLE_PASSWORD,
      });
      expect(api.setHeader).toHaveBeenCalledWith(
        "sid",
        mockResponse.session.sid
      );
      expect(sendMessage).toHaveBeenCalledWith(mockCtx, expect.any(String));
    });

    it("Should handle null response", async () => {
      api.post.mockResolvedValueOnce(null);

      await apiController.authorizeController(mockCtx);

      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH, {
        password: process.env.PIHOLE_PASSWORD,
      });
      expect(api.setHeader).not.toHaveBeenCalled();
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "❌ Authorization failed: Invalid response from server"
      );
    });

    it("Should handle response without session", async () => {
      api.post.mockResolvedValueOnce({});

      await apiController.authorizeController(mockCtx);

      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH, {
        password: process.env.PIHOLE_PASSWORD,
      });
      expect(api.setHeader).not.toHaveBeenCalled();
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "❌ Authorization failed: Invalid response from server"
      );
    });

    it("Should handle response without session.sid", async () => {
      api.post.mockResolvedValueOnce({ session: {} });

      await apiController.authorizeController(mockCtx);

      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH, {
        password: process.env.PIHOLE_PASSWORD,
      });
      expect(api.setHeader).not.toHaveBeenCalled();
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "❌ Authorization failed: Invalid response from server"
      );
    });
  });

  describe("Logout Controller", () => {
    it("preserves the session if logout fails", async () => {
      api.delete.mockRejectedValueOnce(new Error("logout failed"));
      await expect(apiController.logoutController(mockCtx)).rejects.toThrow("logout failed");
      expect(api.setHeader).not.toHaveBeenCalled();
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("Should logout the user", async () => {
      await apiController.logoutController(mockCtx);

      expect(api.delete).toHaveBeenCalledWith(API_ENDPOINTS.AUTH);
      expect(api.setHeader).toHaveBeenCalledWith("sid", "");
      expect(sendMessage).toHaveBeenCalledWith(mockCtx, expect.any(String));
    });
  });

  describe("Messages Controller", () => {
    it("Should get messages from Pi-hole", async () => {
      const mockResponse = {
        messages: [
          {
            timestamp: 1609459200,
            plain: "Test message",
          },
        ],
      };

      api.get.mockResolvedValueOnce(mockResponse);

      await apiController.messagesController(mockCtx);

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        `${new Date(1609459200000).toLocaleString()} - Test message`
      );
    });

    it("Should return a message if there are no messages", async () => {
      const mockResponse = {
        messages: [],
      };

      api.get.mockResolvedValueOnce(mockResponse);

      await apiController.messagesController(mockCtx);

      expect(sendMessage).toHaveBeenCalledWith(mockCtx, "No messages found");
    });

    it("Should handle null response", async () => {
      api.get.mockResolvedValueOnce(null);

      await apiController.messagesController(mockCtx);

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "❌ Failed to retrieve messages: Invalid response from server"
      );
    });

    it("Should handle response without messages property", async () => {
      api.get.mockResolvedValueOnce({});

      await apiController.messagesController(mockCtx);

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "❌ Failed to retrieve messages: Invalid response from server"
      );
    });
  });
});

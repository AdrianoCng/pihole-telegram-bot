import apiController from "../apiController.js";
import api from "../../api.js";
import { sendMessage } from "../../helpers/index.js";
import { API_ENDPOINTS } from "../../constants/api";

jest.mock("../../api.js");
jest.mock("../../helpers/index.js");

describe("API Controllers", () => {
  const mockCtx = {
    from: {
      id: 123,
    },
    reply: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authorize Controller", () => {
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
  });

  describe("Logout Controller", () => {
    it("Should logout the user", async () => {
      await apiController.logoutController(mockCtx);

      expect(api.delete).toHaveBeenCalledWith(API_ENDPOINTS.AUTH);
      expect(sendMessage).toHaveBeenCalledWith(mockCtx, expect.any(String));
    });
  });

  describe("Messages Controller", () => {
    it("Should get messages from Pi-hole", async () => {
      const mockResponse = {
        messages: [
          {
            timestamp: "2021-01-01T00:00:00.000Z",
            plain: "Test message",
          },
        ],
      };

      api.get.mockResolvedValueOnce(mockResponse);

      await apiController.messagesController(mockCtx);

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "1/1/2021, 12:00:00 AM - Test message"
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
  });
});

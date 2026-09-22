import botController from "../botController.js";
import { sendMessage, getMainMenu } from "../../helpers/index.js";
import botService from "../../services/botService.js";

import { createMockContext } from "../../__tests__/helpers/testUtils";

jest.mock("../../helpers/index.js");
jest.mock("../../services/botService.js");

describe("Bot Controller", () => {
  const mockCtx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("botVersionController", () => {
    it("Should return the bot version", async () => {
      botService.getVersion.mockResolvedValueOnce("1.1.0");

      await botController.botVersionController(mockCtx);

      expect(botService.getVersion).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "The bot version is v1.1.0"
      );
    });

    it("Should propagate errors from the bot service", async () => {
      botService.getVersion.mockRejectedValueOnce(new Error("File not found"));

      await expect(botController.botVersionController(mockCtx)).rejects.toThrow(
        "File not found"
      );

      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("menuController", () => {
    it("Should send the menu", async () => {
      botController.menuController(mockCtx);

      expect(sendMessage).toHaveBeenCalledWith(mockCtx, "Here are the available commands:", getMainMenu());
    });
  });
});

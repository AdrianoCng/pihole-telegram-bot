import createBotVersionCommand from "../botVersion.js";
import createMenuCommand from "../menu.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("Bot Commands", () => {
  let mockSender;
  let ctx;

  beforeEach(() => {
    mockSender = { send: jest.fn() };
    ctx = createMockContext();
  });

  describe("botVersion", () => {
    let command;

    it("reads version and sends it", async () => {
      const readVersion = jest.fn().mockResolvedValue("1.2.0");
      command = createBotVersionCommand({
        messageSender: mockSender,
        readVersion,
      });

      await command.handler(ctx);

      expect(readVersion).toHaveBeenCalled();
      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "The bot version is v1.2.0"
      );
    });

    it("handles different version formats", async () => {
      const readVersion = jest.fn().mockResolvedValue("0.1.0-beta");
      command = createBotVersionCommand({
        messageSender: mockSender,
        readVersion,
      });

      await command.handler(ctx);

      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "The bot version is v0.1.0-beta"
      );
    });
  });

  describe("menu", () => {
    it("sends menu with keyboard from getMainMenu", async () => {
      const mockMenu = { reply_markup: {} };
      const mockGetMainMenu = jest.fn().mockReturnValue(mockMenu);

      const command = createMenuCommand({
        messageSender: mockSender,
        getMainMenu: mockGetMainMenu,
      });

      await command.handler(ctx);

      expect(mockGetMainMenu).toHaveBeenCalled();
      expect(mockSender.send).toHaveBeenCalledWith(
        ctx,
        "Here are the available commands:",
        mockMenu
      );
    });

    it("has showInKeyboard set to false", () => {
      const command = createMenuCommand({
        messageSender: mockSender,
        getMainMenu: jest.fn(),
      });
      expect(command.showInKeyboard).toBe(false);
    });
  });
});

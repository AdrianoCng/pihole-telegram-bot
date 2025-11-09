import botController from "../botController.js";
import { sendMessage } from "../../helpers/index.js";
import fs from "fs/promises";
import path from "path";

jest.mock("../../helpers/index.js");
jest.mock("fs/promises");

describe("Bot Controller", () => {
  const mockCtx = {
    from: {
      id: 123,
    },
    reply: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("botVersionController", () => {
    it("Should read package.json and return the bot version", async () => {
      const mockPackageJson = JSON.stringify({
        name: "pihole-telegram-bot",
        version: "1.1.0",
      });

      fs.readFile.mockResolvedValueOnce(mockPackageJson);

      await botController.botVersionController(mockCtx);

      expect(fs.readFile).toHaveBeenCalledWith(
        path.resolve(process.cwd(), "package.json"),
        "utf8"
      );
      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "The bot version is v1.1.0"
      );
    });

    it("Should handle different version formats correctly", async () => {
      const mockPackageJson = JSON.stringify({
        name: "pihole-telegram-bot",
        version: "2.0.0-beta.1",
      });

      fs.readFile.mockResolvedValueOnce(mockPackageJson);

      await botController.botVersionController(mockCtx);

      expect(sendMessage).toHaveBeenCalledWith(
        mockCtx,
        "The bot version is v2.0.0-beta.1"
      );
    });

    it("Should handle errors when reading package.json fails", async () => {
      const mockError = new Error("File not found");
      fs.readFile.mockRejectedValueOnce(mockError);

      await expect(botController.botVersionController(mockCtx)).rejects.toThrow(
        "File not found"
      );

      expect(fs.readFile).toHaveBeenCalledWith(
        path.resolve(process.cwd(), "package.json"),
        "utf8"
      );
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("Should handle errors when package.json is invalid JSON", async () => {
      const invalidJson = "{ invalid json }";
      fs.readFile.mockResolvedValueOnce(invalidJson);

      await expect(
        botController.botVersionController(mockCtx)
      ).rejects.toThrow();

      expect(fs.readFile).toHaveBeenCalledWith(
        path.resolve(process.cwd(), "package.json"),
        "utf8"
      );
      expect(sendMessage).not.toHaveBeenCalled();
    });
  });
});

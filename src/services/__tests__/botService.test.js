import fs from "fs/promises";
import botService from "../botService.js";

jest.mock("fs/promises");

describe("botService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the bot version from package.json", async () => {
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify({ name: "pihole-telegram-bot", version: "2.0.0-beta.1" })
    );

    await expect(botService.getVersion()).resolves.toBe("2.0.0-beta.1");
    expect(fs.readFile).toHaveBeenCalledWith(
      new URL("../../../package.json", import.meta.url),
      "utf8"
    );
  });

  it("propagates errors when package.json cannot be read", async () => {
    fs.readFile.mockRejectedValueOnce(new Error("File not found"));

    await expect(botService.getVersion()).rejects.toThrow("File not found");
  });

  it("propagates errors when package.json contains invalid JSON", async () => {
    fs.readFile.mockResolvedValueOnce("{ invalid json }");

    await expect(botService.getVersion()).rejects.toThrow();
  });
});

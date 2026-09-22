import api from "../../api.js";
import { API_ENDPOINTS } from "../../constants/api.js";
import { CLI_COMMANDS } from "../../constants/cli.js";
import spawnPiholeCommand from "../../helpers/spawnPiholeCommand.js";
import piholeService from "../piholeService.js";

jest.mock("../../api.js", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    setHeader: jest.fn(),
  },
}));
jest.mock("../../helpers/spawnPiholeCommand.js");

describe("piholeService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, PIHOLE_PASSWORD: "test-password" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates and stores a Pi-hole session", async () => {
    api.post.mockResolvedValue({ session: { sid: "test-sid" } });

    await expect(piholeService.authorize()).resolves.toBe(true);

    expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH, {
      password: "test-password",
    });
    expect(api.setHeader).toHaveBeenCalledWith("sid", "test-sid");
  });

  it.each([null, {}, { session: {} }])(
    "rejects an invalid authorization response %#",
    async (response) => {
      api.post.mockResolvedValue(response);

      await expect(piholeService.authorize()).resolves.toBe(false);
      expect(api.setHeader).not.toHaveBeenCalled();
    }
  );

  it("reads the password before making an authorization request", async () => {
    delete process.env.PIHOLE_PASSWORD;

    await expect(piholeService.authorize()).rejects.toThrow(
      "Missing required environment variable: PIHOLE_PASSWORD"
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("logs out before clearing the local session", async () => {
    await piholeService.logout();

    expect(api.delete).toHaveBeenCalledWith(API_ENDPOINTS.AUTH);
    expect(api.setHeader).toHaveBeenCalledWith("sid", "");
  });

  it("preserves the local session when logout fails", async () => {
    api.delete.mockRejectedValue(new Error("logout failed"));

    await expect(piholeService.logout()).rejects.toThrow("logout failed");
    expect(api.setHeader).not.toHaveBeenCalled();
  });

  it("returns messages from a valid response", async () => {
    const messages = [{ timestamp: 1, plain: "message" }];
    api.get.mockResolvedValue({ messages });

    await expect(piholeService.getMessages()).resolves.toBe(messages);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
  });

  it.each([null, {}, { messages: "invalid" }])(
    "returns null for an invalid messages response %#",
    async (response) => {
      api.get.mockResolvedValue(response);
      await expect(piholeService.getMessages()).resolves.toBeNull();
    }
  );

  it.each([
    ["getStatus", CLI_COMMANDS.STATUS],
    ["enable", CLI_COMMANDS.ENABLE],
    ["disable", CLI_COMMANDS.DISABLE],
    ["getVersion", CLI_COMMANDS.VERSION],
    ["update", CLI_COMMANDS.UPDATE],
    ["updateGravity", CLI_COMMANDS.UPGRAVITY],
  ])("runs %s through the Pi-hole command executor", async (method, command) => {
    const onOutput = jest.fn();
    spawnPiholeCommand.mockResolvedValue();

    await piholeService[method](onOutput);

    expect(spawnPiholeCommand).toHaveBeenCalledWith([command], onOutput);
  });
});

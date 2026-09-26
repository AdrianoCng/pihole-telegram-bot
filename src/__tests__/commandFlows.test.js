import { registerCommands } from "../helpers/botCommands.js";
import piholeService from "../services/piholeService.js";
import systemService from "../services/systemService.js";

jest.mock("../services/piholeService.js", () => ({
  __esModule: true,
  default: {
    authorize: jest.fn(), logout: jest.fn(), getMessages: jest.fn(), getSummary: jest.fn(),
    getStatus: jest.fn(), enable: jest.fn(), disable: jest.fn(), getVersion: jest.fn(),
    update: jest.fn(), updateGravity: jest.fn(),
  },
}));
jest.mock("../services/systemService.js", () => ({
  __esModule: true,
  default: { reboot: jest.fn(), upgradeHost: jest.fn() },
}));

const handlers = new Map();
registerCommands({
  command(triggers, handler) {
    for (const trigger of Array.isArray(triggers) ? triggers : [triggers]) {
      handlers.set(trigger, handler);
    }
  },
});

const context = () => ({ reply: jest.fn().mockResolvedValue(undefined) });
const run = (trigger, ctx = context()) => handlers.get(trigger)(ctx);

beforeEach(() => jest.resetAllMocks());

it("routes aliases to the same command", () => {
  expect(handlers.get("stats")).toBe(handlers.get("summary"));
  expect(handlers.get("s")).toBe(handlers.get("status"));
  expect(handlers.get("upg")).toBe(handlers.get("upgrade"));
});

it("sends a summary as one readable reply", async () => {
  piholeService.getSummary.mockResolvedValue({
    blockingState: "active",
    queries: { total: 10, blocked: 1, percentBlocked: 10, cached: 5, forwarded: 4 },
    activeClients: 2, gravityDomains: 1000, gravityLastUpdate: 0, messageCount: 3,
  });
  const ctx = context();

  await run("stats", ctx);

  expect(ctx.reply).toHaveBeenCalledTimes(1);
  expect(ctx.reply.mock.calls[0][0]).toContain("🟢 Pi-hole is active\n\nQueries: 10");
  expect(ctx.reply.mock.calls[0][0]).toContain("⚠️ Pi-hole messages: 3");
});

it("reports authorization and logout outcomes", async () => {
  const ctx = context();
  piholeService.authorize.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

  await run("authorize", ctx);
  await run("a", ctx);
  await run("logout", ctx);

  expect(ctx.reply.mock.calls.map(([message]) => message)).toEqual([
    "✅ Authorized successfully",
    "❌ Authorization failed: Invalid response from server",
    "✅ Logged out successfully",
  ]);
});

it("shows Pi-hole messages and reports malformed message data", async () => {
  const ctx = context();
  piholeService.getMessages.mockResolvedValueOnce([]).mockResolvedValueOnce(null);

  await run("messages", ctx);
  await run("m", ctx);

  expect(ctx.reply.mock.calls.map(([message]) => message)).toEqual([
    "No messages found",
    "❌ Failed to retrieve messages: Invalid response from server",
  ]);
});

it("does not report a successful logout after a failure", async () => {
  const ctx = context();
  const error = new Error("logout failed");
  piholeService.logout.mockRejectedValue(error);

  await expect(run("logout", ctx)).rejects.toBe(error);
  expect(ctx.reply).not.toHaveBeenCalled();
});

it("sends Pi-hole command output and propagates a failed upgrade", async () => {
  const ctx = context();
  piholeService.enable.mockImplementation(async (output) => output("blocking enabled"));
  systemService.upgradeHost.mockRejectedValue(new Error("upgrade failed"));

  await run("enable", ctx);
  expect(ctx.reply).toHaveBeenCalledWith("blocking enabled", undefined);
  await expect(run("upg", ctx)).rejects.toThrow("upgrade failed");
});

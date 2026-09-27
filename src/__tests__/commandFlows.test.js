import { it, expect, beforeEach, vi } from "vitest";
import { registerCommands } from "../helpers/botCommands.js";
import piholeService from "../services/piholeService.js";
import systemService from "../services/systemService.js";
import { pauseActionController } from "../controllers/pauseController.js";

vi.mock("../services/piholeService.js", () => ({
  default: {
    authorize: vi.fn(), logout: vi.fn(), getMessages: vi.fn(), getSummary: vi.fn(),
    getStatus: vi.fn(), enable: vi.fn(), disable: vi.fn(), pause: vi.fn(), getVersion: vi.fn(),
    update: vi.fn(), updateGravity: vi.fn(),
  },
}));
vi.mock("../services/systemService.js", () => ({
  default: { reboot: vi.fn(), upgradeHost: vi.fn() },
}));

const handlers = new Map();
registerCommands({
  command(triggers, handler) {
    for (const trigger of Array.isArray(triggers) ? triggers : [triggers]) {
      handlers.set(trigger, handler);
    }
  },
});

const context = () => ({ reply: vi.fn().mockResolvedValue(undefined) });
const run = (trigger, ctx = context()) => handlers.get(trigger)(ctx);

beforeEach(() => { vi.resetAllMocks(); });

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

it("offers preset and custom pause durations", async () => {
  const ctx = { ...context(), payload: "" };

  await run("pause", ctx);

  const [message, extra] = ctx.reply.mock.calls[0];
  expect(message).toBe("Pause blocking for how long?");
  expect(extra.reply_markup.inline_keyboard.flat().map((b) => b.callback_data)).toEqual([
    "pause:10", "pause:30", "pause:300", "pause:custom",
  ]);
  expect(piholeService.pause).not.toHaveBeenCalled();
});

it("pauses for a custom duration given as an argument", async () => {
  const ctx = { ...context(), payload: "2m" };
  piholeService.pause.mockImplementation(async (seconds, output) => output("[✓] Pi-hole Disabled"));

  await run("pause", ctx);

  expect(piholeService.pause).toHaveBeenCalledWith(120, expect.any(Function));
  expect(ctx.reply.mock.calls.map(([message]) => message)).toEqual([
    "✅ Pi-hole Disabled",
  ]);
});

it("rejects an invalid pause duration without pausing", async () => {
  const ctx = { ...context(), payload: "nonsense" };

  await run("p", ctx);

  expect(piholeService.pause).not.toHaveBeenCalled();
  expect(ctx.reply.mock.calls[0][0]).toMatch(/^❌ Invalid duration\. Send \/pause <time>/);
});

it("does not confirm a pause that failed", async () => {
  const ctx = { ...context(), payload: "30s" };
  const error = new Error("pause failed");
  piholeService.pause.mockRejectedValue(error);

  await expect(run("pause", ctx)).rejects.toBe(error);
  expect(ctx.reply).not.toHaveBeenCalled();
});

const actionContext = (choice) => ({
  ...context(),
  match: [`pause:${choice}`, choice],
  answerCbQuery: vi.fn().mockResolvedValue(true),
  editMessageReplyMarkup: vi.fn().mockResolvedValue(true),
});

it("pauses for a preset chosen from the keyboard", async () => {
  const ctx = actionContext("30");

  await pauseActionController(ctx);

  expect(ctx.answerCbQuery).toHaveBeenCalled();
  expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
  expect(piholeService.pause).toHaveBeenCalledWith(30, expect.any(Function));
});

it("explains how to send a custom pause duration", async () => {
  const ctx = actionContext("custom");

  await pauseActionController(ctx);

  expect(ctx.answerCbQuery).toHaveBeenCalled();
  expect(piholeService.pause).not.toHaveBeenCalled();
  expect(ctx.reply.mock.calls[0][0]).toMatch(/^Send \/pause <time>/);
});

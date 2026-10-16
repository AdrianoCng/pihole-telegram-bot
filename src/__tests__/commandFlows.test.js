import { it, expect, beforeEach, vi } from "vitest";
import { COMMANDS } from "../app/commands.js";
import { registerCommands } from "../app/registry.js";
import * as blocking from "../features/blocking/service.js";
import * as messages from "../features/messages/service.js";
import * as pause from "../features/pause/service.js";
import * as recent from "../features/recent/service.js";
import * as session from "../features/session/service.js";
import * as summary from "../features/summary/service.js";
import * as system from "../features/system/service.js";
import * as top from "../features/top/service.js";
import { pauseAction } from "../features/pause/command.js";

vi.mock("../features/blocking/service.js");
vi.mock("../features/messages/service.js");
vi.mock("../features/pause/service.js");
vi.mock("../features/recent/service.js");
vi.mock("../features/session/service.js");
vi.mock("../features/summary/service.js");
vi.mock("../features/system/service.js");
vi.mock("../features/top/service.js");

const handlers = new Map();
registerCommands(
  {
    command(triggers, handler) {
      for (const trigger of Array.isArray(triggers) ? triggers : [triggers]) {
        handlers.set(trigger, handler);
      }
    },
  },
  COMMANDS
);

const context = () => ({ reply: vi.fn().mockResolvedValue(undefined) });
const run = (trigger, ctx = context()) => handlers.get(trigger)(ctx);

beforeEach(() => {
  vi.resetAllMocks();
});

it("routes aliases to the same command", () => {
  expect(handlers.get("stats")).toBe(handlers.get("summary"));
  expect(handlers.get("s")).toBe(handlers.get("status"));
  expect(handlers.get("t")).toBe(handlers.get("top"));
  expect(handlers.get("rc")).toBe(handlers.get("recent"));
  expect(handlers.get("upg")).toBe(handlers.get("upgrade"));
});

it("sends a summary as one readable reply", async () => {
  summary.getSummary.mockResolvedValue({
    blockingState: "active",
    queries: { total: 10, blocked: 1, percentBlocked: 10, cached: 5, forwarded: 4 },
    activeClients: 2,
    gravityDomains: 1000,
    gravityLastUpdate: 0,
    messageCount: 3,
  });
  const ctx = context();

  await run("stats", ctx);

  expect(ctx.reply).toHaveBeenCalledTimes(1);
  expect(ctx.reply.mock.calls[0][0]).toContain("🟢 Pi-hole is active\n\nQueries: 10");
  expect(ctx.reply.mock.calls[0][0]).toContain("⚠️ Pi-hole messages: 3");
});

it("sends top domains and clients as one reply", async () => {
  top.getTop.mockResolvedValue({
    topDomains: [{ domain: "ads.example.com", count: 3 }],
    topClients: null,
  });
  const ctx = context();

  await run("t", ctx);

  expect(ctx.reply).toHaveBeenCalledTimes(1);
  expect(ctx.reply.mock.calls[0][0]).toContain("1. <code>ads.example.com</code> — 3");
  expect(ctx.reply.mock.calls[0][1]).toEqual({ parse_mode: "HTML" });
  expect(ctx.reply.mock.calls[0][0]).toContain("⚠️ Top clients unavailable");
});

it("sends recently blocked domains as one reply", async () => {
  recent.getRecentBlocked.mockResolvedValue([
    { domain: "ads.example.com", time: Date.now() / 1000, ip: "10.0.0.2", name: "" },
  ]);
  const ctx = context();

  await run("rc", ctx);

  expect(ctx.reply).toHaveBeenCalledTimes(1);
  expect(ctx.reply.mock.calls[0][0]).toContain(
    "1. <code>ads.example.com</code> — just now · <code>10.0.0.2</code>"
  );
  expect(ctx.reply.mock.calls[0][1]).toEqual({ parse_mode: "HTML" });
  expect(recent.getRecentBlocked).toHaveBeenCalledWith(undefined);
});

it("treats a whitespace-only recent payload as unfiltered", async () => {
  recent.getRecentBlocked.mockResolvedValue([]);
  const ctx = { ...context(), payload: "   " };

  await run("recent", ctx);

  expect(recent.getRecentBlocked).toHaveBeenCalledWith(undefined);
  expect(ctx.reply.mock.calls[0][0]).toBe("<b>🚫 Recently blocked</b>\nNo blocked queries yet");
});

it("sends recently blocked domains for one client", async () => {
  recent.getRecentBlocked.mockResolvedValue([
    { domain: "tracker.example.net", time: Date.now() / 1000, ip: "192.168.1.5", name: "" },
  ]);
  const ctx = { ...context(), payload: "192.168.1.5" };

  await run("recent", ctx);

  expect(recent.getRecentBlocked).toHaveBeenCalledWith({
    param: "client_ip",
    value: "192.168.1.5",
  });
  expect(ctx.reply.mock.calls[0][0]).toMatch(
    /^<b>🚫 Recently blocked · client 192\.168\.1\.5<\/b>\n1\. <code>tracker\.example\.net<\/code>/
  );
  expect(ctx.reply.mock.calls[0][1]).toEqual({ parse_mode: "HTML" });
});

it("sends recently blocked queries for one domain through the alias", async () => {
  recent.getRecentBlocked.mockResolvedValue([]);
  const ctx = { ...context(), payload: "domain Ads.Example.com." };

  await run("rc", ctx);

  expect(recent.getRecentBlocked).toHaveBeenCalledWith({
    param: "domain",
    value: "ads.example.com",
  });
  expect(ctx.reply.mock.calls[0][0]).toBe(
    "<b>🚫 Recently blocked · domain ads.example.com</b>\nNo blocked queries for domain ads.example.com"
  );
});

it("rejects an invalid recent filter without reading Pi-hole", async () => {
  const ctx = { ...context(), payload: "domain" };

  await run("rc", ctx);

  expect(recent.getRecentBlocked).not.toHaveBeenCalled();
  expect(ctx.reply).toHaveBeenCalledTimes(1);
  expect(ctx.reply.mock.calls[0][0]).toBe(
    "❌ Invalid filter. Send /recent, /recent <client IP or hostname>, or /recent domain <domain>, e.g. /recent 192.168.1.5 or /recent domain ads.example.com. Use * as a wildcard, e.g. /recent 192.168.1.* or /recent domain *.example.com."
  );
});

it("reports authorization and logout outcomes", async () => {
  const ctx = context();
  session.authorize.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

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
  messages.getMessages.mockResolvedValueOnce([]).mockResolvedValueOnce(null);

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
  session.logout.mockRejectedValue(error);

  await expect(run("logout", ctx)).rejects.toBe(error);
  expect(ctx.reply).not.toHaveBeenCalled();
});

it("sends Pi-hole command output and propagates a failed upgrade", async () => {
  const ctx = context();
  blocking.enable.mockImplementation(async (output) => output("blocking enabled"));
  system.upgradeHost.mockRejectedValue(new Error("upgrade failed"));

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
    "pause:10",
    "pause:30",
    "pause:300",
    "pause:custom",
  ]);
  expect(pause.pause).not.toHaveBeenCalled();
});

it("pauses for a custom duration given as an argument", async () => {
  const ctx = { ...context(), payload: "2m" };
  pause.pause.mockImplementation(async (seconds, output) => output("[✓] Pi-hole Disabled"));

  await run("pause", ctx);

  expect(pause.pause).toHaveBeenCalledWith(120, expect.any(Function));
  expect(ctx.reply.mock.calls.map(([message]) => message)).toEqual(["✅ Pi-hole Disabled"]);
});

it("rejects an invalid pause duration without pausing", async () => {
  const ctx = { ...context(), payload: "nonsense" };

  await run("p", ctx);

  expect(pause.pause).not.toHaveBeenCalled();
  expect(ctx.reply.mock.calls[0][0]).toMatch(/^❌ Invalid duration\. Send \/pause <time>/);
});

it("does not confirm a pause that failed", async () => {
  const ctx = { ...context(), payload: "30s" };
  const error = new Error("pause failed");
  pause.pause.mockRejectedValue(error);

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

  await pauseAction.handler(ctx);

  expect(ctx.answerCbQuery).toHaveBeenCalled();
  expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
  expect(pause.pause).toHaveBeenCalledWith(30, expect.any(Function));
});

it("explains how to send a custom pause duration", async () => {
  const ctx = actionContext("custom");

  await pauseAction.handler(ctx);

  expect(ctx.answerCbQuery).toHaveBeenCalled();
  expect(pause.pause).not.toHaveBeenCalled();
  expect(ctx.reply.mock.calls[0][0]).toMatch(/^Send \/pause <time>/);
});

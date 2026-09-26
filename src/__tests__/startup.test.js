import { it, expect, afterEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { API_ENDPOINTS } from "../constants/api.js";
import { COMMANDS } from "../constants/commands.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("dotenv/config");
  vi.doUnmock("../bot.js");
  vi.doUnmock("../api.js");
  vi.doUnmock("../services/piholeService.js");
  vi.doUnmock("../helpers/logSafeError.js");
  vi.resetModules();
});

async function loadEntrypoint({ failure = false, hasSession = false, logout = async () => {} } = {}) {
  const events = [];
  const bot = {
    telegram: { setMyCommands: vi.fn(async () => {
      events.push("register");
      if (failure) throw new Error("Telegram unavailable");
    }) },
    launch: vi.fn(() => events.push("launch")),
    stop: vi.fn((signal) => events.push("stop:" + signal)),
  };
  const api = { hasSession: vi.fn(() => hasSession) };
  const piholeService = {
    logout: vi.fn(async (options) => {
      events.push("logout");
      return logout(options);
    }),
  };
  const logSafeError = vi.fn();
  const handlers = new Map();
  const originalOnce = process.once;
  vi.spyOn(process, "once").mockImplementation(function (event, callback) {
    if (event === "SIGINT" || event === "SIGTERM") {
      handlers.set(event, callback);
      return this;
    }
    return originalOnce.call(this, event, callback);
  });
  const consoleMock = { error: vi.spyOn(console, "error").mockImplementation(() => {}) };

  vi.resetModules();
  vi.doMock("dotenv/config", () => ({}));
  vi.doMock("../bot.js", () => ({ default: bot }));
  vi.doMock("../api.js", () => ({ default: api }));
  vi.doMock("../services/piholeService.js", () => ({ default: piholeService }));
  vi.doMock("../helpers/logSafeError.js", () => ({ logSafeError }));
  await import("../../index.js");

  const handler = async (signal) => { await handlers.get(signal)(); };
  return { events, bot, piholeService, logSafeError, handlers, consoleMock, handler };
}

it.each([false, true])("launches after autocomplete registration (failure: %s)", async (failure) => {
  const { events, bot, handlers, consoleMock, piholeService, handler } = await loadEntrypoint({ failure });
  expect(events).toEqual(["register", "launch"]);
  expect(bot.telegram.setMyCommands).toHaveBeenCalledWith(
    COMMANDS.map(({ trigger, description }) => ({ command: trigger[0], description }))
  );
  if (failure) {
    expect(consoleMock.error).toHaveBeenCalledWith(
      "[warn] Failed to register commands with Telegram:", "Telegram unavailable"
    );
  } else {
    expect(consoleMock.error).not.toHaveBeenCalled();
  }
  expect([...handlers.keys()]).toEqual(["SIGINT", "SIGTERM"]);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    await handler(signal);
    expect(bot.stop).toHaveBeenLastCalledWith(signal);
  }
  expect(piholeService.logout).not.toHaveBeenCalled();
});

it.each(["SIGINT", "SIGTERM"])("ends the Pi-hole session before stopping on %s", async (signal) => {
  const { events, piholeService, logSafeError, handler } = await loadEntrypoint({ hasSession: true });
  await handler(signal);
  expect(events.slice(-2)).toEqual(["logout", "stop:" + signal]);
  const [[{ signal: abortSignal }]] = piholeService.logout.mock.calls;
  expect(abortSignal).toBeInstanceOf(AbortSignal);
  expect(logSafeError).not.toHaveBeenCalled();
});

it("stops the bot and logs safely when shutdown logout fails", async () => {
  const error = new TypeError("fetch failed");
  const { events, logSafeError, handler } = await loadEntrypoint({
    hasSession: true,
    logout: async () => { throw error; },
  });
  await handler("SIGINT");
  expect(events.slice(-2)).toEqual(["logout", "stop:SIGINT"]);
  expect(logSafeError).toHaveBeenCalledWith({ operation: "logout", path: API_ENDPOINTS.AUTH, error });
});

it("bounds shutdown logout with a one-second timeout", async () => {
  const { events, handler } = await loadEntrypoint({
    hasSession: true,
    logout: ({ signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason));
    }),
  });
  const started = Date.now();
  await handler("SIGTERM");
  expect(Date.now() - started).toBeLessThan(2000);
  expect(events.at(-1)).toBe("stop:SIGTERM");
});

it("loads the bot as native ESM and reads the version outside the repository", () => {
    const first = new URL("../bot.js", import.meta.url).href;
    const controller = new URL("../controllers/botController.js", import.meta.url).href;
    const packageUrl = new URL("../../package.json", import.meta.url).href;
    const script = `
      import assert from "node:assert/strict";
      import { readFile } from "node:fs/promises";
      globalThis.fetch = () => { throw new Error("Unexpected network call"); };
      await import(${JSON.stringify(first)});
      const { default: controller } = await import(${JSON.stringify(controller)});
      const pkg = JSON.parse(await readFile(new URL(${JSON.stringify(packageUrl)}), "utf8"));
      let reply;
      await controller.botVersionController({ reply(message) { reply = message; } });
      assert.equal(reply, "The bot version is v" + pkg.version);
    `;
    expect(() => execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: tmpdir(),
      env: { ...process.env, PIHOLE_IP: "http://pihole.test", BOT_TOKEN: "123:test-token" },
      timeout: 10000,
      stdio: "pipe",
    })).not.toThrow();
});

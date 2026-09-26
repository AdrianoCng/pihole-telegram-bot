import { transformFileSync } from "@babel/core";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { API_ENDPOINTS } from "../constants/api.js";
import { COMMANDS } from "../constants/commands.js";

const entry = fileURLToPath(new URL("../../index.js", import.meta.url));
const { code } = transformFileSync(entry);

function loadEntrypoint({ failure = false, hasSession = false, logout = async () => {} } = {}) {
  const events = [];
  const bot = {
    telegram: { setMyCommands: jest.fn(async () => {
      events.push("register");
      if (failure) throw new Error("Telegram unavailable");
    }) },
    launch: jest.fn(() => events.push("launch")),
    stop: jest.fn((signal) => events.push("stop:" + signal)),
  };
  const api = { hasSession: jest.fn(() => hasSession) };
  const piholeService = {
    logout: jest.fn(async (options) => {
      events.push("logout");
      return logout(options);
    }),
  };
  const logSafeError = jest.fn();
  const processMock = { once: jest.fn() };
  const consoleMock = { error: jest.fn() };
  const ready = vm.runInNewContext("(async () => {" + code + "\n})()", {
    require: (name) => {
      if (name === "dotenv/config") return {};
      if (name === "./src/bot.js") return { __esModule: true, default: bot };
      if (name === "./src/api.js") return { __esModule: true, default: api };
      if (name === "./src/constants/api.js") return { API_ENDPOINTS };
      if (name === "./src/constants/commands.js") return { COMMANDS };
      if (name === "./src/helpers/logSafeError.js") return { logSafeError };
      if (name === "./src/services/piholeService.js") return { __esModule: true, default: piholeService };
      throw new Error("Unexpected import: " + name);
    },
    process: processMock,
    console: consoleMock,
    AbortSignal,
  });
  const handler = async (signal) => {
    const [, callback] = processMock.once.mock.calls.find(([name]) => name === signal);
    await callback();
  };
  return { ready, events, bot, api, piholeService, logSafeError, processMock, consoleMock, handler };
}

it.each([false, true])("launches after autocomplete registration (failure: %s)", async (failure) => {
  const { ready, events, bot, processMock, consoleMock, piholeService, handler } = loadEntrypoint({ failure });
  await ready;
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
  expect(processMock.once.mock.calls.map(([signal]) => signal)).toEqual(["SIGINT", "SIGTERM"]);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    await handler(signal);
    expect(bot.stop).toHaveBeenLastCalledWith(signal);
  }
  expect(piholeService.logout).not.toHaveBeenCalled();
});

it.each(["SIGINT", "SIGTERM"])("ends the Pi-hole session before stopping on %s", async (signal) => {
  const { ready, events, piholeService, logSafeError, handler } = loadEntrypoint({ hasSession: true });
  await ready;
  await handler(signal);
  expect(events.slice(-2)).toEqual(["logout", "stop:" + signal]);
  const [[{ signal: abortSignal }]] = piholeService.logout.mock.calls;
  expect(abortSignal).toBeInstanceOf(AbortSignal);
  expect(logSafeError).not.toHaveBeenCalled();
});

it("stops the bot and logs safely when shutdown logout fails", async () => {
  const error = new TypeError("fetch failed");
  const { ready, events, logSafeError, handler } = loadEntrypoint({
    hasSession: true,
    logout: async () => { throw error; },
  });
  await ready;
  await handler("SIGINT");
  expect(events.slice(-2)).toEqual(["logout", "stop:SIGINT"]);
  expect(logSafeError).toHaveBeenCalledWith({ operation: "logout", path: API_ENDPOINTS.AUTH, error });
});

it("bounds shutdown logout with a one-second timeout", async () => {
  const { ready, events, handler } = loadEntrypoint({
    hasSession: true,
    logout: ({ signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason));
    }),
  });
  await ready;
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

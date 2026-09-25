import { transformFileSync } from "@babel/core";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { COMMANDS } from "../constants/commands.js";
import { API_ENDPOINTS } from "../constants/api.js";

const entry = fileURLToPath(new URL("../../index.js", import.meta.url));
const { code } = transformFileSync(entry);

async function runEntrypoint({ failure = false, hasSession = false, logout = async () => {} } = {}) {
  const events = [];
  const bot = {
    telegram: { setMyCommands: jest.fn(async () => {
      events.push("register");
      if (failure) throw new Error("Telegram unavailable");
    }) },
    launch: jest.fn(() => events.push("launch")),
    stop: jest.fn(),
  };
  const api = { hasSession: jest.fn(() => hasSession) };
  const piholeService = { logout: jest.fn(logout) };
  const logSafeError = jest.fn();
  const processMock = { once: jest.fn() };
  const consoleMock = { error: jest.fn() };
  await vm.runInNewContext("(async () => {" + code + "\n})()", {
    require: (name) => {
      if (name === "dotenv/config") return {};
      if (name === "./src/bot.js") return { __esModule: true, default: bot };
      if (name === "./src/api.js") return { __esModule: true, default: api };
      if (name === "./src/constants/commands.js") return { COMMANDS };
      if (name === "./src/constants/api.js") return { API_ENDPOINTS };
      if (name === "./src/helpers/logSafeError.js") return { logSafeError };
      if (name === "./src/services/piholeService.js") return { __esModule: true, default: piholeService };
      throw new Error("Unexpected import: " + name);
    },
    process: processMock,
    console: consoleMock,
    AbortSignal,
  });
  const handlers = Object.fromEntries(processMock.once.mock.calls);
  return { events, bot, piholeService, logSafeError, processMock, consoleMock, handlers };
}

it.each([false, true])("launches after autocomplete registration (failure: %s)", async (failure) => {
  const { events, bot, piholeService, processMock, consoleMock } = await runEntrypoint({ failure });
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
  for (const [signal, handler] of processMock.once.mock.calls) {
    await handler();
    expect(bot.stop).toHaveBeenLastCalledWith(signal);
  }
  expect(piholeService.logout).not.toHaveBeenCalled();
});

it.each(["SIGINT", "SIGTERM"])("logs out of Pi-hole before stopping on %s", async (signal) => {
  const order = [];
  const { bot, piholeService, logSafeError, handlers } = await runEntrypoint({
    hasSession: true,
    logout: async () => { order.push("logout"); },
  });
  bot.stop.mockImplementation(() => order.push("stop"));

  await handlers[signal]();

  expect(order).toEqual(["logout", "stop"]);
  expect(piholeService.logout).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  expect(bot.stop).toHaveBeenCalledWith(signal);
  expect(logSafeError).not.toHaveBeenCalled();
});

it("still stops the bot when shutdown logout fails", async () => {
  const error = new TypeError("fetch failed");
  const { bot, logSafeError, handlers } = await runEntrypoint({
    hasSession: true,
    logout: async () => { throw error; },
  });

  await handlers.SIGTERM();

  expect(logSafeError).toHaveBeenCalledWith({ operation: "logout", path: API_ENDPOINTS.AUTH, error });
  expect(bot.stop).toHaveBeenCalledWith("SIGTERM");
});

it("bounds a hanging shutdown logout with a short timeout", async () => {
  const { bot, logSafeError, handlers } = await runEntrypoint({
    hasSession: true,
    logout: ({ signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason));
    }),
  });

  const started = Date.now();
  await handlers.SIGINT();

  expect(Date.now() - started).toBeLessThan(3000);
  expect(logSafeError.mock.calls[0][0].error.name).toBe("TimeoutError");
  expect(bot.stop).toHaveBeenCalledWith("SIGINT");
});

it.each([
  "controllers/botController.js", "controllers/apiController.js", "controllers/cliController.js",
  "controllers/summaryController.js", "bot.js",
])(
  "loads native ESM from %s and reads the version outside the repository",
  (firstModule) => {
    const first = new URL("../" + firstModule, import.meta.url).href;
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
  }
);

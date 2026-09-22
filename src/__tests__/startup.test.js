import { transformFileSync } from "@babel/core";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { COMMANDS } from "../constants/commands.js";

const entry = fileURLToPath(new URL("../../index.js", import.meta.url));
const { code } = transformFileSync(entry);

it.each([false, true])("launches after autocomplete registration (failure: %s)", async (failure) => {
  const events = [];
  const bot = {
    telegram: { setMyCommands: jest.fn(async () => {
      events.push("register");
      if (failure) throw new Error("Telegram unavailable");
    }) },
    launch: jest.fn(() => events.push("launch")),
    stop: jest.fn(),
  };
  const processMock = { once: jest.fn() };
  const consoleMock = { error: jest.fn() };
  await vm.runInNewContext("(async () => {" + code + "\n})()", {
    require: (name) => {
      if (name === "dotenv/config") return {};
      if (name === "./src/bot.js") return { __esModule: true, default: bot };
      if (name === "./src/constants/commands.js") return { COMMANDS };
      throw new Error("Unexpected import: " + name);
    },
    process: processMock,
    console: consoleMock,
  });
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
    handler();
    expect(bot.stop).toHaveBeenLastCalledWith(signal);
  }
});

it.each(["controllers/botController.js", "controllers/apiController.js", "controllers/cliController.js", "bot.js"])(
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

import { it, expect, vi } from "vitest";
import { Telegraf } from "telegraf";
import bot from "../bot.js";
import authenticate from "../middlewares/authenticate.js";
import typing from "../middlewares/typing.js";
import handleBotError from "../middlewares/errorHandler.js";
import { TELEGRAM_MESSAGE_TIMEOUT_MS } from "../constants/timers.js";
import { createMockContext } from "./helpers/testUtils.js";

vi.mock("telegraf", async (importOriginal) => ({
  ...await importOriginal(),
  Telegraf: vi.fn(function () {
    return {
      use: vi.fn(), command: vi.fn(), start: vi.fn(),
      help: vi.fn(), on: vi.fn(), catch: vi.fn(),
    };
  }),
}));

// Capture registration before Vitest clears mocks for each test.
const registrations = {
  token: Telegraf.mock.calls[0][0],
  options: Telegraf.mock.calls[0][1],
  middleware: bot.use.mock.calls.map(([middleware]) => middleware),
  commands: [...bot.command.mock.calls],
  start: bot.start.mock.calls[0][0],
  help: bot.help.mock.calls[0][0],
  message: bot.on.mock.calls[0],
  error: bot.catch.mock.calls[0][0],
};

it("registers authentication before commands and configures the Telegram timeout", () => {
  expect(registrations.token).toBe("123:test-token");
  expect(registrations.options).toEqual({ handlerTimeout: TELEGRAM_MESSAGE_TIMEOUT_MS });
  expect(registrations.middleware[0]).toBe(authenticate);
  expect(registrations.middleware).toContain(typing);
  expect(registrations.commands).toEqual(expect.arrayContaining([
    expect.arrayContaining([expect.arrayContaining(["summary", "stats"]), expect.any(Function)]),
  ]));
});

it("sends a greeting with visible commands in the keyboard", () => {
  const ctx = createMockContext();
  registrations.start(ctx);
  const [message, extra] = ctx.reply.mock.calls[0];
  expect(message).toBe("Hello! I'm your Pi-hole bot. How can I help you today?");
  const keyboard = extra.reply_markup.keyboard;
  expect(keyboard.flat()).toContain("/summary");
  expect(keyboard.flat()).not.toContain("/stats");
  expect(keyboard.flat()).not.toContain("/menu");
  expect(extra.reply_markup.resize_keyboard).toBe(true);
});

it("lists aliases in help and handles unknown messages", () => {
  const ctx = createMockContext();
  registrations.help(ctx);
  expect(ctx.reply.mock.calls[0][0]).toContain("/summary, /stats - ");
  expect(registrations.message[0]).toBe("message");
  registrations.message[1](ctx);
  expect(ctx.reply).toHaveBeenLastCalledWith("Sorry, I don't understand that.", undefined);
});

it("registers the central error boundary", () => {
  expect(registrations.error).toBe(handleBotError);
});

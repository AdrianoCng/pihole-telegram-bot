import { Telegraf } from "telegraf";
import bot from "../bot.js";
import { COMMANDS } from "../constants/commands.js";
import authenticate from "../middlewares/authenticate.js";
import typing from "../middlewares/typing.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../errors/PiholeError.js";
import { createMockContext } from "./helpers/testUtils.js";

jest.mock("telegraf", () => ({
  ...jest.requireActual("telegraf"),
  Telegraf: jest.fn().mockImplementation(() => ({
    use: jest.fn(), command: jest.fn(), start: jest.fn(),
    help: jest.fn(), on: jest.fn(), catch: jest.fn(),
  })),
}));

// Capture registration before Jest clears mocks for each test.
const registrations = {
  token: Telegraf.mock.calls[0][0],
  middleware: bot.use.mock.calls.map(([middleware]) => middleware),
  commands: [...bot.command.mock.calls],
  start: bot.start.mock.calls[0][0],
  help: bot.help.mock.calls[0][0],
  message: bot.on.mock.calls[0],
  error: bot.catch.mock.calls[0][0],
};

it("registers authentication before typing and all command aliases", () => {
  expect(registrations.token).toBe("123:test-token");
  expect(registrations.middleware).toEqual([authenticate, typing]);
  expect(registrations.commands).toEqual(COMMANDS.map(({ trigger, handler }) => [trigger, handler]));
  expect(COMMANDS.map(({ trigger }) => trigger)).toEqual([
    ["summary", "stats"], ["status", "s"], ["messages", "m"],
    ["authorize", "a"], ["logout", "logoff"], ["enable", "e"], ["disable", "d"], ["version", "v"],
    ["update", "up"], ["upgravity", "g"], ["reboot", "r"],
    ["upgrade", "upg"], ["bot", "bv"], ["menu"],
  ]);
});

it("sends the greeting and two-column keyboard without the menu command", () => {
  const ctx = createMockContext();
  registrations.start(ctx);
  const [message, extra] = ctx.reply.mock.calls[0];
  expect(message).toBe("Hello! I'm your Pi-hole bot. How can I help you today?");
  const keyboard = extra.reply_markup.keyboard;
  expect(keyboard.every((row) => row.length >= 1 && row.length <= 2)).toBe(true);
  expect(keyboard.slice(0, -1).every((row) => row.length === 2)).toBe(true);
  expect(keyboard.flat().slice(0, 5)).toEqual(["/summary", "/status", "/messages", "/authorize", "/logout"]);
  expect(keyboard.flat()).not.toContain("/stats");
  expect(keyboard.flat()).toEqual(
    COMMANDS.filter((command) => command.showInKeyboard !== false).map(({ trigger }) => "/" + trigger[0])
  );
  expect(extra.reply_markup.resize_keyboard).toBe(true);
});

it("lists aliases in help and handles unknown messages", () => {
  const ctx = createMockContext();
  registrations.help(ctx);
  expect(ctx.reply.mock.calls[0][0]).toBe(COMMANDS.map(({ trigger, description }) =>
    trigger.map((name) => "/" + name).join(", ") + " - " + description
  ).join("\n"));
  expect(registrations.message[0]).toBe("message");
  registrations.message[1](ctx);
  expect(ctx.reply).toHaveBeenLastCalledWith("Sorry, I don't understand that.", undefined);
});

it("replies to Pi-hole errors and propagates other errors", () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  const ctx = createMockContext();
  try {
    registrations.error(new PiholeError(PIHOLE_ERROR_CODES.HTTP, "Unauthorized", 401), ctx);
    expect(ctx.reply).toHaveBeenLastCalledWith("Unauthorized", undefined);
    registrations.error(new PiholeError(PIHOLE_ERROR_CODES.HTTP, ""), ctx);
    expect(ctx.reply).toHaveBeenLastCalledWith("An error occurred 🔥", undefined);
    expect(() => registrations.error({ isApiError: true, message: "legacy" }, ctx)).toThrow("legacy");
    expect(() => registrations.error(new Error("unexpected"), ctx)).toThrow("unexpected");
    expect(() => registrations.error(null, ctx)).toThrow("An error occurred 🔥");
  } finally {
    log.mockRestore();
  }
});

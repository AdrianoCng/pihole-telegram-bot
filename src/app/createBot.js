import { Telegraf } from "telegraf";
import { getEnv } from "../config.js";
import { sendMessage } from "../shared/telegram/sendMessage.js";
import { TELEGRAM_MESSAGE_TIMEOUT_MS } from "../shared/timers.js";
import { ACTIONS, COMMANDS } from "./commands.js";
import { helpText, mainMenu, registerActions, registerCommands } from "./registry.js";
import { authenticate } from "./middleware/authenticate.js";
import { typing } from "./middleware/typing.js";
import { handleBotError } from "./middleware/errorHandler.js";

/** Build the bot: middleware first, then commands, actions and fallbacks. */
export function createBot() {
  const bot = new Telegraf(getEnv("BOT_TOKEN"), {
    handlerTimeout: TELEGRAM_MESSAGE_TIMEOUT_MS,
  });

  bot.use(authenticate);
  bot.use(typing);

  registerCommands(bot, COMMANDS);
  registerActions(bot, ACTIONS);

  bot.start((ctx) =>
    sendMessage(ctx, "Hello! I'm your Pi-hole bot. How can I help you today?", mainMenu(COMMANDS))
  );
  bot.help((ctx) => sendMessage(ctx, helpText(COMMANDS)));
  bot.on("message", (ctx) => sendMessage(ctx, "Sorry, I don't understand that."));

  bot.catch(handleBotError);

  return bot;
}

import { getEnv } from "./helpers/config.js";
import { Telegraf } from "telegraf";
import { sendMessage, registerCommands, getMainMenu } from "./helpers/index.js";
import { COMMANDS } from "./constants/commands.js";
import typing from "./middlewares/typing.js";
import authenticate from "./middlewares/authenticate.js";
import handleBotError from "./middlewares/errorHandler.js";
import { TELEGRAM_MESSAGE_TIMEOUT_MS } from "./constants/timers.js";

const bot = new Telegraf(getEnv("BOT_TOKEN"), {
  handlerTimeout: TELEGRAM_MESSAGE_TIMEOUT_MS,
});

bot.use(authenticate);

bot.use(typing);

registerCommands(bot);

bot.start((ctx) => {
  sendMessage(
    ctx,
    "Hello! I'm your Pi-hole bot. How can I help you today?",
    getMainMenu()
  );
});

bot.help((ctx) => {
  sendMessage(
    ctx,
    COMMANDS.map(({ trigger, description }) => {
      const commands = Array.isArray(trigger) ? trigger : [trigger];

      return `${commands.map((t) => `/${t}`).join(", ")} - ${description}`;
    }).join("\n")
  );
});

bot.on("message", (ctx) => {
  sendMessage(ctx, "Sorry, I don't understand that.");
});

bot.catch(handleBotError);

export default bot;

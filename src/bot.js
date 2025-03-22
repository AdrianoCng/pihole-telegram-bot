import { Telegraf } from "telegraf";
import { registerCommands, sendMessage } from "./helpers.js";
import { COMMANDS } from "./constants/commands.js";
import typing from "./middlewares/typing.js";
import authenticate from "./middlewares/authenticate.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(authenticate);

bot.use(typing);

registerCommands(bot);

bot.start((ctx) => {
  sendMessage(ctx, "Hello! I'm your Pi-hole bot. How can I help you today?");
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

bot.catch((err, ctx) => {
  console.error(err);

  if (!err?.isApiError) {
    throw new Error(err?.message || "An error occurred 🔥");
  }

  sendMessage(ctx, err?.message || "An error occurred 🔥");
});

export default bot;

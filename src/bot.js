import { Telegraf } from "telegraf";

/**
 * @param {Object} deps
 * @param {string} deps.botToken
 * @param {import('./contracts/index.js').CommandDefinition[]} deps.commands
 * @param {Function[]} deps.middlewares
 * @param {import('./contracts/index.js').MessageSender} deps.messageSender
 * @param {any} deps.mainMenu
 */
export default function createBot({ botToken, commands, middlewares, messageSender, mainMenu }) {
  const bot = new Telegraf(botToken);

  middlewares.forEach((middleware) => bot.use(middleware));

  validateCommands(commands);
  commands.forEach(({ trigger, handler }) => bot.command(trigger, handler));

  bot.start((ctx) => {
    messageSender.send(
      ctx,
      "Hello! I'm your Pi-hole bot. How can I help you today?",
      mainMenu
    );
  });

  bot.help((ctx) => {
    messageSender.send(
      ctx,
      commands
        .map(({ trigger, description }) => {
          const triggers = Array.isArray(trigger) ? trigger : [trigger];
          return `${triggers.map((t) => `/${t}`).join(", ")} - ${description}`;
        })
        .join("\n")
    );
  });

  bot.on("message", (ctx) => {
    messageSender.send(ctx, "Sorry, I don't understand that.");
  });

  bot.catch((err, ctx) => {
    console.error(err);

    if (!err?.isApiError) {
      throw new Error(err?.message || "An error occurred 🔥");
    }

    messageSender.send(ctx, err?.message || "An error occurred 🔥");
  });

  return bot;
}

function validateCommands(commands) {
  const seen = new Set();
  const dupes = [];

  for (const { trigger } of commands) {
    for (const t of Array.isArray(trigger) ? trigger : [trigger]) {
      if (seen.has(t)) {
        dupes.push(t);
      } else {
        seen.add(t);
      }
    }
  }

  if (dupes.length > 0) {
    throw new Error(`Duplicate command triggers found: ${dupes.join(", ")}`);
  }
}

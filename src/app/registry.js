import { Markup } from "telegraf";

/** A definition's triggers as an array; the first one is its canonical name. */
export function triggersOf({ trigger }) {
  return Array.isArray(trigger) ? trigger : [trigger];
}

export function validateCommands(commands) {
  const allTriggers = new Set();
  const duplicates = [];

  commands.forEach((command) => {
    triggersOf(command).forEach((trigger) => {
      if (allTriggers.has(trigger)) {
        duplicates.push(trigger);
      } else {
        allTriggers.add(trigger);
      }
    });
  });

  if (duplicates.length > 0) {
    throw new Error(`Duplicate command triggers found: ${duplicates.join(", ")}`);
  }

  return true;
}

export function registerCommands(bot, commands) {
  validateCommands(commands);

  commands.forEach(({ trigger, handler }) => {
    bot.command(trigger, handler);
  });
}

export function registerActions(bot, actions) {
  validateCommands(actions);

  actions.forEach(({ trigger, handler }) => {
    bot.action(trigger, handler);
  });
}

/** Commands in the shape Telegram's setMyCommands expects, for autocomplete. */
export function toTelegramCommands(commands) {
  return commands.map((command) => ({
    command: triggersOf(command)[0],
    description: command.description,
  }));
}

/** One help line per command, listing every alias. */
export function helpText(commands) {
  return commands
    .map((command) => {
      const triggers = triggersOf(command).map((trigger) => `/${trigger}`);
      return `${triggers.join(", ")} - ${command.description}`;
    })
    .join("\n");
}

/** Reply keyboard with the canonical trigger of every visible command. */
export function mainMenu(commands) {
  return Markup.keyboard(
    commands
      .filter((command) => command.showInKeyboard !== false)
      .map((command) => `/${triggersOf(command)[0]}`),
    { columns: 2 }
  ).resize();
}

import { COMMANDS } from "../constants/commands.js";

export function validateCommands(commands) {
  const allTriggers = new Set();
  const duplicates = [];

  commands.forEach((command) => {
    const triggers = Array.isArray(command.trigger)
      ? command.trigger
      : [command.trigger];

    triggers.forEach((trigger) => {
      if (allTriggers.has(trigger)) {
        duplicates.push(trigger);
      } else {
        allTriggers.add(trigger);
      }
    });
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate command triggers found: ${duplicates.join(", ")}`
    );
  }

  return true;
}

export function registerCommands(bot) {
  validateCommands(COMMANDS);

  COMMANDS.forEach(({ trigger, handler }) => {
    bot.command(trigger, handler);
  });
}

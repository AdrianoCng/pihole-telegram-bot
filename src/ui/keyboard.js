import { Markup } from "telegraf";

/**
 * @param {import('../contracts/index.js').CommandDefinition[]} commands
 */
export function getMainMenu(commands) {
  const triggers = commands
    .filter((cmd) => cmd.showInKeyboard !== false)
    .map(({ trigger }) => `/${Array.isArray(trigger) ? trigger[0] : trigger}`);

  return Markup.keyboard(triggers, { columns: 2 }).resize();
}
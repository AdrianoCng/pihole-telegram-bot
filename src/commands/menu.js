/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 * @param {Function} deps.getMainMenu
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
createMenuCommand.needsMenu = true;

export default function createMenuCommand({ messageSender, getMainMenu }) {
  return {
    trigger: ["menu"],
    description: "Show the menu",
    showInKeyboard: false,
    async handler(ctx) {
      messageSender.send(ctx, "Here are the available commands:", getMainMenu());
    },
  };
}

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 * @param {() => Promise<string>} deps.readVersion - Returns the bot version string
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createBotVersionCommand({ messageSender, readVersion }) {
  return {
    trigger: ["bot", "bv"],
    description: "Show the version of the bot",
    async handler(ctx) {
      const version = await readVersion();
      messageSender.send(ctx, `The bot version is v${version}`);
    },
  };
}

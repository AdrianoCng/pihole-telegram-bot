/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').CommandExecutor} deps.commandExecutor
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createRebootCommand({ commandExecutor }) {
  return {
    trigger: ["reboot", "r"],
    description: "Reboot the Raspberry Pi",
    async handler(ctx) {
      await commandExecutor.exec(ctx, "reboot");
    },
  };
}

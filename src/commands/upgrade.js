/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').CommandExecutor} deps.commandExecutor
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createUpgradeCommand({ commandExecutor }) {
  return {
    trigger: ["upgrade", "upg"],
    description: "Upgrade host system",
    async handler(ctx) {
      await commandExecutor.exec(ctx, "apt", ["update"]);
      await commandExecutor.exec(ctx, "apt", ["full-upgrade", "-y"]);
      await commandExecutor.exec(ctx, "apt", ["autoremove", "-y"]);
      await commandExecutor.exec(ctx, "apt", ["clean"]);
    },
  };
}

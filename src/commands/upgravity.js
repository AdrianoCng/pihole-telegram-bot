import { CLI_COMMANDS } from "../constants/cli.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').PiholeExecutor} deps.piholeExecutor
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createUpgravityCommand({ piholeExecutor }) {
  return {
    trigger: ["upgravity", "g"],
    description: "Update the list of ad-serving domains",
    async handler(ctx) {
      await piholeExecutor.exec(ctx, [CLI_COMMANDS.UPGRAVITY]);
    },
  };
}

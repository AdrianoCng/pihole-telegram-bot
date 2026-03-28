import { CLI_COMMANDS } from "../constants/cli.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').PiholeExecutor} deps.piholeExecutor
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createVersionCommand({ piholeExecutor }) {
  return {
    trigger: ["version", "v"],
    description: "Show installed version of Pi-hole, Web Interface & FTL",
    async handler(ctx) {
      await piholeExecutor.exec(ctx, [CLI_COMMANDS.VERSION]);
    },
  };
}

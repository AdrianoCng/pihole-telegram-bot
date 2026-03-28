import { CLI_COMMANDS } from "../constants/cli.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').PiholeExecutor} deps.piholeExecutor
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createStatusCommand({ piholeExecutor }) {
  return {
    trigger: ["status", "s"],
    description: "Display the running status of Pi-hole subsystems",
    async handler(ctx) {
      await piholeExecutor.exec(ctx, [CLI_COMMANDS.STATUS]);
    },
  };
}

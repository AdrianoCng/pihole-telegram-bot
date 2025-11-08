import { execCommandWithOutput } from "./index.js";

/**
 * Spawn a Pi-hole command and send output to chat
 * @param {import('telegraf').Context} ctx
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
export default async function spawnPiholeCommand(ctx, args) {
  return execCommandWithOutput(ctx, "pihole", args);
}

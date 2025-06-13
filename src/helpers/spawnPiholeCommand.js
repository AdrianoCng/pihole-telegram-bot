import { spawn } from "child_process";
import { sendMessage } from "./index.js";

/**
 * Spawn a Pi-hole command and send output to chat
 * @param {import('telegraf').Context} ctx
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
export default async function spawnPiholeCommand(ctx, args) {
  return new Promise((resolve, reject) => {
    const process = spawn("sudo", ["pihole", ...args]);

    process.stdout.on("data", (chunk) => {
      sendMessage(ctx, chunk.toString());
    });

    process.stderr.on("data", (chunk) => {
      sendMessage(ctx, chunk.toString());
      reject();
    });

    process.on("close", () => {
      resolve();
    });
  });
}

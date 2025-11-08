import { spawn } from "child_process";
import { sendMessage } from "./index.js";

/**
 * Helper function to spawn a command with sudo, handle output, and communicate to chat.
 * @param {import('telegraf').Context} ctx
 * @param {string} command The command to run (e.g. "pihole")
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
export default function execCommandWithOutput(ctx, command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn("sudo", [command, ...args]);

    process.stdout.on("data", (chunk) => {
      sendMessage(ctx, chunk.toString());
    });

    process.stderr.on("data", (chunk) => {
      sendMessage(ctx, chunk.toString());
      reject(chunk.toString());
    });

    process.on("close", () => {
      resolve();
    });
  });
}

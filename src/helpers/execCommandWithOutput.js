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
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMessage = `Command failed with exit code ${code}`;
        sendMessage(ctx, errorMessage);
        reject(new Error(errorMessage));
      }
    });
  });
}

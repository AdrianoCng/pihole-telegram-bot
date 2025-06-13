import { exec } from "child_process";
import { sendMessage } from "./helpers/index.js";

/**
 * Execute a Pi-hole command and send output to chat
 * @param {import('telegraf').Context} ctx
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
export default function executePiholeCommand(ctx, args) {
  exec(`sudo pihole ${args.join(" ")}`, (err, stdout, stderr) => {
    if (err) {
      sendMessage(ctx, err?.message);
    }

    if (stderr) {
      sendMessage(ctx, stderr);
    }

    sendMessage(ctx, stdout);
  });
}

import { COMMANDS } from "./constants/commands.js";
import { exec, spawn } from "child_process";

function validateCommands(commands) {
  const allTriggers = new Set();
  const duplicates = [];

  commands.forEach((command) => {
    const triggers = Array.isArray(command.trigger)
      ? command.trigger
      : [command.trigger];

    triggers.forEach((trigger) => {
      if (allTriggers.has(trigger)) {
        duplicates.push(trigger);
      } else {
        allTriggers.add(trigger);
      }
    });
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate command triggers found: ${duplicates.join(", ")}`
    );
  }

  return true;
}

function registerCommands(bot) {
  validateCommands(COMMANDS);

  COMMANDS.forEach(({ trigger, handler }) => {
    bot.command(trigger, handler);
  });
}

/**
 * Spawn a Pi-hole command and send output to chat
 * @param {import('telegraf').Context} ctx
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
async function spawnPiholeCommand(ctx, args) {
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

/**
 * Execute a Pi-hole command and send output to chat
 * @param {import('telegraf').Context} ctx
 * @param {string[]} args Command arguments
 * @returns {Promise<void>}
 */
function executePiholeCommand(ctx, args) {
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

function sendMessage(ctx, message) {
  const emojiMap = new Map([
    ["[✓]", "✅"],
    ["[✗]", "❌"],
    ["[i]", "ℹ️"],
  ]);

  emojiMap.forEach((emoji, key) => {
    message = message.replace(key, emoji);
  });

  ctx.reply(message);
}

export {
  validateCommands,
  registerCommands,
  spawnPiholeCommand,
  executePiholeCommand,
  sendMessage,
};

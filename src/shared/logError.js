import { inspect } from "node:util";
import { env } from "../config.js";

/**
 * Log a failure with its full details (message, stack, own fields, causes).
 * Telegram client errors can embed the bot token in the request URL, so the
 * token is masked before anything is written.
 */
export function logError({ operation, path, error }) {
  const label = path ? `${operation} ${path}` : operation;
  const output = inspect(error, { depth: 4 }).replaceAll(env.BOT_TOKEN, "<redacted>");

  console.error(`[${label}]`, output);
}

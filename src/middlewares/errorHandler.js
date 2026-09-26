import { DEFAULT_ERROR_MESSAGES } from "../constants/errorMessages.js";
import { classifyError } from "../errors/classifyError.js";
import { sendMessage } from "../helpers/index.js";
import { logSafeError } from "../helpers/logSafeError.js";

export function userMessage(error) {
  const message = DEFAULT_ERROR_MESSAGES[classifyError(error)];
  return typeof message === "function" ? message(error) : message;
}

/**
 * The single error boundary for every update: log safely, reply with a fixed
 * message, and never rethrow so one failed update cannot stop the bot.
 */
export async function handleBotError(error, ctx) {
  logSafeError({ operation: ctx?.command ?? "update", error });

  try {
    await sendMessage(ctx, userMessage(error));
  } catch (replyError) {
    logSafeError({ operation: "error-reply", path: "telegram", error: replyError });
  }
}

export default handleBotError;

import { DEFAULT_ERROR_MESSAGES } from "../../shared/errors/messages.js";
import { classifyError } from "../../shared/errors/classifyError.js";
import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { getBooleanEnv } from "../../config.js";
import { logSafeError } from "../../shared/logSafeError.js";

const MAX_DEBUG_MESSAGE_LENGTH = 500;

export function userMessage(error) {
  const message = DEFAULT_ERROR_MESSAGES[classifyError(error)];
  return typeof message === "function" ? message(error) : message;
}

/** Allowlisted error details appended to the reply when DEBUG is enabled. */
export function debugDetails(error) {
  const name = error?.name ?? "Error";
  const message = String(error?.message ?? error ?? "").slice(0, MAX_DEBUG_MESSAGE_LENGTH);
  const lines = [`[i] Debug: ${name}${message ? `: ${message}` : ""}`];

  for (const key of ["status", "code", "exitCode", "path"]) {
    if (error?.[key] !== undefined) lines.push(`${key}: ${error[key]}`);
  }

  return `\n\n${lines.join("\n")}`;
}

/**
 * The single error boundary for every update: log safely, reply with a fixed
 * message, and never rethrow so one failed update cannot stop the bot.
 */
export async function handleBotError(error, ctx) {
  logSafeError({ operation: ctx?.command ?? "update", error });

  try {
    const debug = getBooleanEnv("DEBUG") ? debugDetails(error) : "";
    await sendMessage(ctx, userMessage(error) + debug);
  } catch (replyError) {
    logSafeError({ operation: "error-reply", path: "telegram", error: replyError });
  }
}

import { AppError, UNEXPECTED_ERROR_MESSAGE } from "../../shared/errors/AppError.js";
import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { env } from "../../config.js";
import { logSafeError } from "../../shared/logSafeError.js";

const MAX_DEBUG_MESSAGE_LENGTH = 500;

export function userMessage(error) {
  return error instanceof AppError ? error.userMessage : UNEXPECTED_ERROR_MESSAGE;
}

function describe(error) {
  const name = error?.name ?? "Error";
  const message = String(error?.message ?? error ?? "").slice(0, MAX_DEBUG_MESSAGE_LENGTH);
  return `${name}${message ? `: ${message}` : ""}`;
}

/** The first stack frame, e.g. `parse (/app/src/features/top/parse.js:12:9)`. */
function stackLocation(error) {
  const frame = error?.stack?.split("\n").find((line) => line.trimStart().startsWith("at "));
  return frame?.trim().slice("at ".length);
}

/**
 * Error details appended to the reply when DEBUG is enabled: the error's own
 * allowlisted fields and cause chain, or the throwing location for a bug.
 */
export function debugDetails(error) {
  const lines = [`[i] Debug: ${describe(error)}`];

  if (error instanceof AppError) {
    for (const [key, value] of Object.entries(error.debugFields())) {
      if (value !== undefined) lines.push(`${key}: ${value}`);
    }
    for (const cause of error.debugCauses()) {
      const code = typeof cause?.code === "string" ? ` (${cause.code})` : "";
      lines.push(`caused by: ${describe(cause)}${code}`);
    }
  } else {
    const location = stackLocation(error);
    if (location) lines.push(`at: ${location}`);
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
    const debug = env.DEBUG ? debugDetails(error) : "";
    await sendMessage(ctx, userMessage(error) + debug);
  } catch (replyError) {
    logSafeError({ operation: "error-reply", path: "telegram", error: replyError });
  }
}

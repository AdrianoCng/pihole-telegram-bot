import { env } from "../config.js";
import { AppError } from "./errors/AppError.js";

/**
 * Log a failure using only allowlisted fields. Never pass headers, session IDs,
 * passwords, or payloads. When DEBUG is enabled, the error's own debug fields
 * and the full error (message, stack, cause) are also logged.
 */
export function logSafeError({
  operation,
  error,
  path = error?.path,
  afterRetry = error?.afterRetry === true,
}) {
  const details = { operation, path };

  if (error?.status !== undefined) details.status = error.status;
  if (error?.name !== undefined) details.name = error.name;
  if (error?.code !== undefined) details.code = error.code;
  if (error?.exitCode !== undefined) details.exitCode = error.exitCode;
  details.afterRetry = afterRetry;
  if (env.DEBUG && error instanceof AppError) details.debug = error.debugFields();

  console.error(JSON.stringify(details));

  if (error !== undefined && env.DEBUG) {
    console.error("[debug]", { operation }, error);
  }
}

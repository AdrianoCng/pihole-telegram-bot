import { logError } from "./logError.js";

/**
 * Parse a settled supplementary read. If the read was rejected or the parse
 * throws, log a safe diagnostic and return `fallback(error)`.
 */
export function optional(result, { parse, fallback, operation, path }) {
  const fail = (error) => {
    logError({ operation, path, error });
    return fallback(error);
  };

  if (result.status === "rejected") return fail(result.reason);

  try {
    return parse(result.value);
  } catch (error) {
    return fail(error);
  }
}

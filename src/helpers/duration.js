import { MAX_PAUSE_SECONDS } from "../constants/pause.js";

const UNIT_SECONDS = { s: 1, m: 60, h: 60 * 60 };

/**
 * Parse a pause duration such as `45`, `45s`, `5m` or `1h`.
 * Bare numbers are seconds. Returns whole seconds, or null when invalid.
 */
export function parseDuration(text) {
  const match = /^(\d+)([smh]?)$/i.exec(String(text ?? "").trim());
  if (!match) return null;

  const seconds = Number(match[1]) * UNIT_SECONDS[(match[2] || "s").toLowerCase()];
  if (seconds <= 0 || seconds > MAX_PAUSE_SECONDS) return null;

  return seconds;
}
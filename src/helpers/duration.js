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

/** Format seconds as a short label, for example "10 sec" or "1 h 30 min". */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours && `${hours} h`,
    minutes && `${minutes} min`,
    secs && `${secs} sec`,
  ].filter(Boolean).join(" ");
}

import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../constants/top.js";
import { clientLabel, code, truncate } from "./htmlFormat.js";
import { formatAge } from "./timeFormat.js";

const TITLE = "<b>🚫 Recently blocked</b>";

export function renderRecent(entries, nowMs) {
  if (entries.length === 0) return [TITLE, "No blocked queries yet"].join("\n");

  const message = [
    TITLE,
    ...entries.map(
      (entry, index) =>
        `${index + 1}. ${code(truncate(entry.domain))} — ${formatAge(entry.time, nowMs)} · ${clientLabel(entry)}`
    ),
  ].join("\n");

  return truncate(message, TELEGRAM_MESSAGE_MAX_LENGTH);
}

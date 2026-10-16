import {
  TELEGRAM_MESSAGE_MAX_LENGTH,
  clientLabel,
  code,
  escapeHtml,
  truncate,
} from "../shared/telegram/html.js";
import { formatAge } from "../shared/format/time.js";

const TITLE = "🚫 Recently blocked";

/** Escaped label such as `client my-phone`, or null for the unfiltered list. */
function filterLabel(filter) {
  if (filter?.type !== "client" && filter?.type !== "domain") return null;
  return `${filter.type} ${escapeHtml(truncate(filter.value))}`;
}

export function renderRecent(entries, nowMs, filter) {
  const label = filterLabel(filter);
  const title = `<b>${label ? `${TITLE} · ${label}` : TITLE}</b>`;

  if (entries.length === 0) {
    return [title, label ? `No blocked queries for ${label}` : "No blocked queries yet"].join("\n");
  }

  const message = [
    title,
    ...entries.map(
      (entry, index) =>
        `${index + 1}. ${code(truncate(entry.domain))} — ${formatAge(entry.time, nowMs)} · ${clientLabel(entry)}`
    ),
  ].join("\n");

  return truncate(message, TELEGRAM_MESSAGE_MAX_LENGTH);
}

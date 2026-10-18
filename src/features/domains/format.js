import { TELEGRAM_MESSAGE_MAX_LENGTH, code, truncate } from "../../shared/telegram/html.js";
import { DOMAIN_KINDS, DOMAIN_LISTS } from "./constants.js";
import { displayDomain } from "./parse.js";

const SECTIONS = [
  { list: DOMAIN_LISTS.allow, title: "✅ Allowlist" },
  { list: DOMAIN_LISTS.deny, title: "🚫 Denylist" },
];

const KIND_TITLES = [
  { kind: DOMAIN_KINDS.EXACT, title: "Exact" },
  { kind: DOMAIN_KINDS.REGEX, title: "Regex" },
];

const ENTRY_PREFIX = "• ";

function renderEntry(entry) {
  const label = `${ENTRY_PREFIX}${code(truncate(displayDomain(entry)))}`;
  return entry.enabled ? label : `${label} (disabled)`;
}

function renderSection({ list, title }, entries) {
  const onList = entries.filter((entry) => entry.type === list.type);
  if (onList.length === 0) return [`<b>${title}</b>`, "No entries"];

  return [
    `<b>${title}</b>`,
    ...KIND_TITLES.flatMap(({ kind, title: kindTitle }) => {
      const ofKind = onList.filter((entry) => entry.kind === kind);
      return ofKind.length === 0 ? [] : [`<i>${kindTitle}</i>`, ...ofKind.map(renderEntry)];
    }),
  ];
}

/** Drop trailing lines that do not fit rather than cutting an HTML tag. */
function fitLines(lines, maxLength) {
  const message = lines.join("\n");
  if (message.length <= maxLength) return message;

  const total = lines.filter((line) => line.startsWith(ENTRY_PREFIX)).length;
  const kept = [];
  let length = 0;
  let shown = 0;

  for (const line of lines) {
    const more = `…and ${total - shown} more`;
    if (length + line.length + 1 + more.length > maxLength) return [...kept, more].join("\n");

    kept.push(line);
    length += line.length + 1;
    if (line.startsWith(ENTRY_PREFIX)) shown += 1;
  }

  return message;
}

/** One message per list, so a long allowlist never pushes the denylist out. */
export function renderDomains(entries) {
  if (entries.length === 0) return ["No allow or deny domains yet"];

  return SECTIONS.map((section) =>
    fitLines(renderSection(section, entries), TELEGRAM_MESSAGE_MAX_LENGTH)
  );
}

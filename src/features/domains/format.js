import {
  TELEGRAM_MESSAGE_MAX_LENGTH,
  code,
  escapeHtml,
  truncate,
} from "../../shared/telegram/html.js";
import { DOMAIN_KINDS, DOMAIN_LISTS, GRAVITY_TYPES, SEARCH_LIMIT } from "./constants.js";
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

const LIST_TITLES = {
  [GRAVITY_TYPES.ALLOW]: "✅ allowlist",
  [GRAVITY_TYPES.BLOCK]: "🚫 blocklist",
};

function renderGroups(ids, groups) {
  if (ids.length === 0) return "no groups";

  const names = ids.map((id) => {
    const group = groups.get(id);
    if (!group) return `#${id}`;
    const name = escapeHtml(truncate(group.name));
    return group.enabled ? name : `${name} (disabled)`;
  });
  return `groups: ${names.join(", ")}`;
}

function renderState(entry, groups) {
  return `${entry.enabled ? "enabled" : "disabled"} · ${renderGroups(entry.groups, groups)}`;
}

function renderRules({ list, title }, { rules, groups }) {
  const onList = rules.filter((rule) => rule.type === list.type);
  if (onList.length === 0) return [];

  return [
    `<b>${title}</b>`,
    ...onList.map(
      (rule) =>
        `${ENTRY_PREFIX}${code(truncate(displayDomain(rule)))} ${rule.kind} · ${renderState(rule, groups)}`
    ),
  ];
}

function renderLists({ lists, groups }) {
  if (lists.length === 0) return [];

  return [
    "<b>📋 Subscribed lists</b>",
    ...lists.map(
      (list) =>
        `${ENTRY_PREFIX}${LIST_TITLES[list.type]} ${code(list.address)} · ${renderState(list, groups)}`
    ),
  ];
}

/** Every allow/deny rule and subscribed list matching a domain, with state and groups. */
export function renderCheck(result) {
  const header = `🔎 ${code(result.domain)}`;

  if (result.rules.length === 0 && result.lists.length === 0) {
    return [header, "No allow/deny rule or subscribed list matches this domain"].join("\n");
  }

  return fitLines(
    [
      header,
      // Near the top so fitLines never drops it.
      ...(result.truncated
        ? [`<i>Showing the first ${SEARCH_LIMIT} matches; more exist.</i>`]
        : []),
      "",
      ...SECTIONS.flatMap((section) => renderRules(section, result)),
      ...renderLists(result),
      "",
      "<i>A rule applies only to clients in one of its groups.</i>",
    ],
    TELEGRAM_MESSAGE_MAX_LENGTH
  );
}

import { TELEGRAM_MESSAGE_MAX_LENGTH, TOP_LABEL_MAX_LENGTH } from "../constants/top.js";
import { formatCount } from "./numberFormat.js";

function truncate(value, maxLength = TOP_LABEL_MAX_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function code(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

function renderSection(title, entries, { unavailable, empty, label }) {
  if (entries === null) return [`⚠️ ${unavailable}`];
  if (entries.length === 0) return [`<b>${title}</b>`, empty];

  return [
    `<b>${title}</b>`,
    ...entries.map((entry, index) => `${index + 1}. ${label(entry)} — ${formatCount(entry.count)}`),
  ];
}

export function renderTop({ topDomains, topClients }) {
  const message = [
    ...renderSection("🚫 Top blocked domains", topDomains, {
      unavailable: "Top blocked domains unavailable",
      empty: "No blocked domains yet",
      label: ({ domain }) => code(truncate(domain)),
    }),
    "",
    ...renderSection("💻 Top clients", topClients, {
      unavailable: "Top clients unavailable",
      empty: "No client activity yet",
      label: ({ ip, name }) =>
        name && name !== ip ? `${escapeHtml(truncate(name))} (${code(ip)})` : code(ip),
    }),
  ].join("\n");

  return truncate(message, TELEGRAM_MESSAGE_MAX_LENGTH);
}

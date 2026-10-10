import { TELEGRAM_MESSAGE_MAX_LENGTH, TOP_LABEL_MAX_LENGTH } from "../constants/top.js";
import { formatCount } from "./numberFormat.js";

function truncate(value, maxLength = TOP_LABEL_MAX_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function clientLabel({ ip, name }) {
  return name && name !== ip ? `${truncate(name)} (${ip})` : ip;
}

function renderSection(title, entries, { unavailable, empty, label }) {
  if (entries === null) return [`⚠️ ${unavailable}`];
  if (entries.length === 0) return [title, empty];

  return [
    title,
    ...entries.map((entry, index) => `${index + 1}. ${label(entry)} — ${formatCount(entry.count)}`),
  ];
}

export function renderTop({ topDomains, topClients }) {
  const message = [
    ...renderSection("🚫 Top blocked domains", topDomains, {
      unavailable: "Top blocked domains unavailable",
      empty: "No blocked domains yet",
      label: ({ domain }) => truncate(domain),
    }),
    "",
    ...renderSection("💻 Top clients", topClients, {
      unavailable: "Top clients unavailable",
      empty: "No client activity yet",
      label: clientLabel,
    }),
  ].join("\n");

  return truncate(message, TELEGRAM_MESSAGE_MAX_LENGTH);
}

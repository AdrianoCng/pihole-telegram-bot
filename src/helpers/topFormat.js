import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../constants/top.js";
import { clientLabel, code, truncate } from "./htmlFormat.js";
import { formatCount } from "./numberFormat.js";

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
      label: clientLabel,
    }),
  ].join("\n");

  return truncate(message, TELEGRAM_MESSAGE_MAX_LENGTH);
}

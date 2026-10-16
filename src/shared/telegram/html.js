export const LABEL_MAX_LENGTH = 60;
export const TELEGRAM_MESSAGE_MAX_LENGTH = 4096;

export function truncate(value, maxLength = LABEL_MAX_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function code(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

/** Client label: escaped name with the IP when they differ, otherwise just the IP. */
export function clientLabel({ ip, name }) {
  return name && name !== ip ? `${escapeHtml(truncate(name))} (${code(ip)})` : code(ip);
}

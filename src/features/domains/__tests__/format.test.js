import { it, expect } from "vitest";
import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../../../shared/telegram/html.js";
import { renderDomains } from "../format.js";

const entry = (domain, type, kind, enabled = true) => ({ domain, type, kind, enabled });

const many = (count, type) =>
  Array.from({ length: count }, (_, index) => entry(`domain-${index}.example.com`, type, "exact"));

it("renders one message per list, exact before regex", () => {
  expect(
    renderDomains([
      entry("(\\.|^)ads\\.example$", "deny", "regex"),
      entry("^track", "allow", "regex", false),
      entry("example.com", "allow", "exact"),
      entry("bad.example", "deny", "exact"),
    ])
  ).toEqual([
    [
      "<b>✅ Allowlist</b>",
      "<i>Exact</i>",
      "• <code>example.com</code>",
      "<i>Regex</i>",
      "• <code>^track</code> (disabled)",
    ].join("\n"),
    [
      "<b>🚫 Denylist</b>",
      "<i>Exact</i>",
      "• <code>bad.example</code>",
      "<i>Regex</i>",
      "• <code>*.ads.example</code>",
    ].join("\n"),
  ]);
});

it("marks a list without entries", () => {
  expect(renderDomains([entry("bad.example", "deny", "exact")])).toEqual([
    "<b>✅ Allowlist</b>\nNo entries",
    "<b>🚫 Denylist</b>\n<i>Exact</i>\n• <code>bad.example</code>",
  ]);
});

it("says when there are no entries at all", () => {
  expect(renderDomains([])).toEqual(["No allow or deny domains yet"]);
});

it("escapes HTML in regexes", () => {
  expect(renderDomains([entry("a<b&c>", "allow", "regex")])[0]).toContain(
    "• <code>a&lt;b&amp;c&gt;</code>"
  );
});

it("drops entries that do not fit and says how many", () => {
  const [, message] = renderDomains(many(300, "deny"));
  const shown = message.split("\n").filter((line) => line.startsWith("• ")).length;

  expect(message.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_MAX_LENGTH);
  expect(message.endsWith(`…and ${300 - shown} more`)).toBe(true);
  expect(shown).toBeGreaterThan(0);
});

it("keeps the denylist when the allowlist is too long", () => {
  const [allowMessage, denyMessage] = renderDomains([
    ...many(200, "allow"),
    entry("bad.example", "deny", "exact"),
  ]);
  const shown = allowMessage.split("\n").filter((line) => line.startsWith("• ")).length;

  expect(allowMessage.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_MAX_LENGTH);
  expect(allowMessage.endsWith(`…and ${200 - shown} more`)).toBe(true);
  expect(denyMessage).toBe("<b>🚫 Denylist</b>\n<i>Exact</i>\n• <code>bad.example</code>");
});

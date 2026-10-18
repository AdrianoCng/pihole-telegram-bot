import { it, expect } from "vitest";
import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../../../shared/telegram/html.js";
import { renderDomains } from "../format.js";

const entry = (domain, type, kind, enabled = true) => ({ domain, type, kind, enabled });

it("groups entries by list, then exact before regex", () => {
  expect(
    renderDomains([
      entry("(\\.|^)ads\\.example$", "deny", "regex"),
      entry("^track", "allow", "regex", false),
      entry("example.com", "allow", "exact"),
      entry("bad.example", "deny", "exact"),
    ])
  ).toBe(
    [
      "<b>✅ Allowlist</b>",
      "<i>Exact</i>",
      "• <code>example.com</code>",
      "<i>Regex</i>",
      "• <code>^track</code> (disabled)",
      "",
      "<b>🚫 Denylist</b>",
      "<i>Exact</i>",
      "• <code>bad.example</code>",
      "<i>Regex</i>",
      "• <code>*.ads.example</code>",
    ].join("\n")
  );
});

it("marks a list without entries", () => {
  expect(renderDomains([entry("bad.example", "deny", "exact")])).toBe(
    "<b>✅ Allowlist</b>\nNo entries\n\n<b>🚫 Denylist</b>\n<i>Exact</i>\n• <code>bad.example</code>"
  );
});

it("says when there are no entries at all", () => {
  expect(renderDomains([])).toBe("No allow or deny domains yet");
});

it("escapes HTML in regexes", () => {
  expect(renderDomains([entry("a<b&c>", "allow", "regex")])).toContain(
    "• <code>a&lt;b&amp;c&gt;</code>"
  );
});

it("drops entries that do not fit and says how many", () => {
  const entries = Array.from({ length: 300 }, (_, index) =>
    entry(`domain-${index}.example.com`, "deny", "exact")
  );

  const message = renderDomains(entries);
  const shown = message.split("\n").filter((line) => line.startsWith("• ")).length;

  expect(message.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_MAX_LENGTH);
  expect(message.endsWith(`…and ${300 - shown} more`)).toBe(true);
  expect(shown).toBeGreaterThan(0);
});

import { it, expect } from "vitest";
import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../../../shared/telegram/html.js";
import { renderCheck, renderDomains } from "../format.js";

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

const groups = new Map([
  [0, { name: "Default", enabled: true }],
  [1, { name: "Kids <5>", enabled: false }],
]);
const rule = (type, kind, overrides = {}) => ({
  domain: "example.com",
  type,
  kind,
  enabled: true,
  groups: [0],
  ...overrides,
});
const list = (type, overrides = {}) => ({
  address: "https://lists.example/hosts",
  type,
  enabled: true,
  groups: [0],
  ...overrides,
});
const check = ({ rules = [], lists = [], truncated = false } = {}) => ({
  domain: "example.com",
  rules,
  lists,
  truncated,
  groups,
});

it("reports a domain no rule matches", () => {
  expect(renderCheck(check())).toBe(
    [
      "🔎 <code>example.com</code>",
      "No allow/deny rule or subscribed list matches this domain",
    ].join("\n")
  );
});

it("lists matching rules and lists with state and groups", () => {
  expect(
    renderCheck(
      check({
        rules: [
          rule("allow", "regex", { domain: "(\\.|^)example\\.com$", groups: [0, 1, 7] }),
          rule("deny", "exact", { enabled: false, groups: [] }),
        ],
        lists: [list("block"), list("allow", { address: "https://allow.example/list" })],
      })
    )
  ).toBe(
    [
      "🔎 <code>example.com</code>",
      "",
      "<b>✅ Allowlist</b>",
      "• <code>*.example.com</code> regex · enabled · groups: Default, Kids &lt;5&gt; (disabled), #7",
      "<b>🚫 Denylist</b>",
      "• <code>example.com</code> exact · disabled · no groups",
      "<b>📋 Subscribed lists</b>",
      "• 🚫 blocklist <code>https://lists.example/hosts</code> · enabled · groups: Default",
      "• ✅ allowlist <code>https://allow.example/list</code> · enabled · groups: Default",
      "",
      "<i>A rule applies only to clients in one of its groups.</i>",
    ].join("\n")
  );
});

it("says when results were cut at the limit", () => {
  const lines = renderCheck(check({ lists: [list("block")], truncated: true })).split("\n");

  expect(lines[0]).toBe("🔎 <code>example.com</code>");
  expect(lines[1]).toBe("<i>Showing the first 20 matches; more exist.</i>");
});

it("does not mention a limit when results are complete", () => {
  expect(renderCheck(check({ lists: [list("block")] }))).not.toContain("Showing the first");
});

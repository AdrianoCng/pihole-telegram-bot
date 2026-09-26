import { it, expect } from "vitest";
import { renderSummary } from "../summaryFormat.js";

const now = Date.UTC(2026, 8, 25, 12);
const model = (overrides = {}) => ({
  blockingState: "active",
  queries: { total: 10, blocked: 2, percentBlocked: 20, cached: 3, forwarded: 5 },
  activeClients: 2, gravityDomains: 1000, gravityLastUpdate: now / 1000 - 3600,
  messageCount: null,
  ...overrides,
});

it("renders the user-facing dashboard", () => {
  expect(renderSummary(model({ messageCount: 3 }), now)).toBe([
    "🟢 Pi-hole is active", "", "Queries: 10", "Blocked: 2 (20.0%)",
    "Cached: 3 (30.0%)", "Forwarded: 5 (50.0%)", "Active clients: 2",
    "Gravity domains: 1,000", "Gravity updated: 1 hour ago", "",
    "⚠️ Pi-hole messages: 3",
  ].join("\n"));
});

it("shows disabled and unavailable states", () => {
  expect(renderSummary(model({ blockingState: "disabled" }), now)).toContain("🔴 Pi-hole blocking is disabled");
  expect(renderSummary(model({ blockingState: "unavailable" }), now)).toContain("🟠 Pi-hole status is unavailable");
});

it("handles zero queries and unknown update times without NaN", () => {
  const output = renderSummary(model({
    queries: { total: 0, blocked: 0, percentBlocked: 0, cached: 0, forwarded: 0 },
    gravityLastUpdate: 0, messageCount: 0,
  }), now);

  expect(output).toContain("Cached: 0 (0.0%)\nForwarded: 0 (0.0%)");
  expect(output).toContain("Gravity updated: unknown");
  expect(output).not.toMatch(/NaN|messages/);
});

import {
  formatCount,
  formatGravityAge,
  formatPercentage,
  renderSummary,
} from "../summaryFormat.js";

const NOW_MS = Date.UTC(2026, 8, 25, 12, 0, 0);
const NOW_S = NOW_MS / 1000;
const TWO_HOURS_AGO = NOW_S - 2 * 60 * 60;

const model = (overrides = {}) => ({
  blockingState: "active",
  queries: { total: 52491, blocked: 8643, percentBlocked: 16.465679, cached: 17952, forwarded: 25896 },
  activeClients: 23,
  gravityDomains: 1234567,
  gravityLastUpdate: TWO_HOURS_AGO,
  messageCount: null,
  ...overrides,
});

const METRICS = [
  "Queries: 52,491",
  "Blocked: 8,643 (16.5%)",
  "Cached: 17,952 (34.2%)",
  "Forwarded: 25,896",
  "Active clients: 23",
  "Gravity domains: 1,234,567",
  "Gravity updated: 2 hours ago",
];

describe("formatCount", () => {
  it.each([[0, "0"], [999, "999"], [1000, "1,000"], [1234567, "1,234,567"]])(
    "formats %d as %s",
    (value, expected) => {
      expect(formatCount(value)).toBe(expected);
    }
  );
});

describe("formatPercentage", () => {
  it.each([[0, "0.0%"], [16.465679, "16.5%"], [100, "100.0%"], [34.19, "34.2%"]])(
    "formats %d as %s",
    (value, expected) => {
      expect(formatPercentage(value)).toBe(expected);
    }
  );
});

describe("formatGravityAge", () => {
  it.each([
    ["0 s", 0, "just now"],
    ["59 s", 59, "just now"],
    ["60 s", 60, "1 minute ago"],
    ["119 s", 119, "1 minute ago"],
    ["2 min", 120, "2 minutes ago"],
    ["59 min", 59 * 60, "59 minutes ago"],
    ["60 min", 60 * 60, "1 hour ago"],
    ["23 h", 23 * 60 * 60, "23 hours ago"],
    ["24 h", 24 * 60 * 60, "1 day ago"],
    ["3 days", 3 * 24 * 60 * 60, "3 days ago"],
  ])("formats an age of %s", (_case, ageSeconds, expected) => {
    expect(formatGravityAge(NOW_S - ageSeconds, NOW_MS)).toBe(expected);
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["NaN", NaN],
    ["infinite", Infinity],
    ["a string", String(TWO_HOURS_AGO)],
    ["null", null],
    ["undefined", undefined],
    ["in the future", NOW_S + 60],
  ])("returns unknown for a timestamp that is %s", (_case, timestamp) => {
    expect(formatGravityAge(timestamp, NOW_MS)).toBe("unknown");
  });
});

describe("renderSummary", () => {
  it("renders the active dashboard", () => {
    expect(renderSummary(model(), NOW_MS)).toBe(["🟢 Pi-hole is active", "", ...METRICS].join("\n"));
  });

  it("renders the disabled dashboard", () => {
    expect(renderSummary(model({ blockingState: "disabled" }), NOW_MS)).toBe(
      ["🔴 Pi-hole blocking is disabled", "", ...METRICS].join("\n")
    );
  });

  it.each(["unavailable", undefined, "bogus"])("renders the unavailable dashboard for %p", (blockingState) => {
    expect(renderSummary(model({ blockingState }), NOW_MS)).toBe(
      ["🟠 Pi-hole status is unavailable", "", ...METRICS].join("\n")
    );
  });

  it("adds a positive message count after a blank line", () => {
    expect(renderSummary(model({ messageCount: 1 }), NOW_MS)).toBe(
      ["🟢 Pi-hole is active", "", ...METRICS, "", "⚠️ Pi-hole messages: 1"].join("\n")
    );
  });

  it.each([0, null])("omits a message count of %p", (messageCount) => {
    expect(renderSummary(model({ messageCount }), NOW_MS)).not.toContain("messages");
  });

  it("shows 0.0% cached when there are no queries", () => {
    const output = renderSummary(
      model({ queries: { total: 0, blocked: 0, percentBlocked: 0, cached: 0, forwarded: 0 } }),
      NOW_MS
    );

    expect(output).toContain("Queries: 0\nBlocked: 0 (0.0%)\nCached: 0 (0.0%)");
    expect(output).not.toContain("NaN");
  });

  it("shows an unknown gravity update", () => {
    expect(renderSummary(model({ gravityLastUpdate: 0 }), NOW_MS)).toContain("Gravity updated: unknown");
  });
});

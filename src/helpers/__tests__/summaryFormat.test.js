import {
  formatCount,
  formatGravityAge,
  formatPercentage,
  renderSummary,
} from "../summaryFormat.js";

const NOW_MS = 1_758_700_000_000;
const NOW_S = NOW_MS / 1000;

const MODEL = {
  blockingState: "active",
  queries: { total: 52491, blocked: 8643, percentBlocked: 16.465679, cached: 17952, forwarded: 25896 },
  activeClients: 23,
  gravityDomains: 1234567,
  gravityLastUpdate: NOW_S - 2 * 3600,
  messageCount: 1,
};

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
    "formats %s as %s", (value, expected) => {
      expect(formatCount(value)).toBe(expected);
    }
  );
});

describe("formatPercentage", () => {
  it.each([[0, "0.0%"], [16.465679, "16.5%"], [100, "100.0%"], [34.2, "34.2%"]])(
    "formats %s as %s", (value, expected) => {
      expect(formatPercentage(value)).toBe(expected);
    }
  );
});

describe("formatGravityAge", () => {
  it.each([
    ["zero", 0],
    ["negative", -5],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["a string", "1758700000"],
    ["undefined", undefined],
    ["null", null],
    ["in the future", NOW_S + 60],
  ])("returns unknown for %s", (_label, timestamp) => {
    expect(formatGravityAge(timestamp, NOW_MS)).toBe("unknown");
  });

  it.each([
    [0, "just now"],
    [59, "just now"],
    [60, "1 minute ago"],
    [119, "1 minute ago"],
    [120, "2 minutes ago"],
    [59 * 60 + 59, "59 minutes ago"],
    [60 * 60, "1 hour ago"],
    [2 * 3600, "2 hours ago"],
    [23 * 3600, "23 hours ago"],
    [24 * 3600 - 1, "23 hours ago"],
    [24 * 3600, "1 day ago"],
    [3 * 86400, "3 days ago"],
  ])("formats an age of %s seconds as %s", (seconds, expected) => {
    expect(formatGravityAge(NOW_S - seconds, NOW_MS)).toBe(expected);
  });
});

describe("renderSummary", () => {
  it("renders the active dashboard with a message count", () => {
    expect(renderSummary(MODEL, NOW_MS)).toBe(
      ["🟢 Pi-hole is active", "", ...METRICS, "", "⚠️ Pi-hole messages: 1"].join("\n")
    );
  });

  it.each([
    ["disabled", "🔴 Pi-hole blocking is disabled"],
    ["unavailable", "🟠 Pi-hole status is unavailable"],
    ["something-else", "🟠 Pi-hole status is unavailable"],
  ])("renders the %s state without messages", (blockingState, statusLine) => {
    expect(renderSummary({ ...MODEL, blockingState, messageCount: 0 }, NOW_MS)).toBe(
      [statusLine, "", ...METRICS].join("\n")
    );
  });

  it("omits an unavailable message count", () => {
    expect(renderSummary({ ...MODEL, messageCount: null }, NOW_MS)).not.toContain("messages");
  });

  it("shows 0.0% cached and unknown gravity age for an empty Pi-hole", () => {
    const text = renderSummary({
      ...MODEL,
      queries: { total: 0, blocked: 0, percentBlocked: 0, cached: 0, forwarded: 0 },
      gravityLastUpdate: 0,
    }, NOW_MS);

    expect(text).toContain("Queries: 0\nBlocked: 0 (0.0%)\nCached: 0 (0.0%)");
    expect(text).toContain("Gravity updated: unknown");
  });
});

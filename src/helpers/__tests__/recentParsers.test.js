import { it, expect } from "vitest";
import { RECENT_BLOCKED_COUNT } from "../../constants/recent.js";
import { parseRecentBlocked } from "../recentParsers.js";

const invalid = "Pi-hole returned an invalid response";
const query = (overrides = {}) => ({
  time: 1758801600.5,
  domain: "ads.example.com",
  client: { ip: "192.168.1.2", name: "laptop" },
  ...overrides,
});

it("parses blocked queries", () => {
  expect(parseRecentBlocked({ queries: [query()] })).toEqual([
    { domain: "ads.example.com", time: 1758801600.5, ip: "192.168.1.2", name: "laptop" },
  ]);
});

it("defaults a missing client name to an empty string", () => {
  expect(
    parseRecentBlocked({ queries: [query({ client: { ip: "10.0.0.2", name: null } })] })[0].name
  ).toBe("");
});

it("caps entries at the requested count", () => {
  const queries = Array.from({ length: RECENT_BLOCKED_COUNT + 5 }, () => query());
  expect(parseRecentBlocked({ queries })).toHaveLength(RECENT_BLOCKED_COUNT);
});

it("rejects invalid payloads", () => {
  expect(() => parseRecentBlocked({})).toThrow(invalid);
  expect(() => parseRecentBlocked({ queries: [query({ domain: "" })] })).toThrow(invalid);
  expect(() => parseRecentBlocked({ queries: [query({ time: "1" })] })).toThrow(invalid);
  expect(() => parseRecentBlocked({ queries: [query({ client: null })] })).toThrow(invalid);
});

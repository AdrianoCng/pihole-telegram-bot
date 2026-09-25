import { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import {
  parseBlockingState,
  parseMessageCount,
  parseSummaryResponse,
} from "../summaryParsers.js";

// Shape of the installed Pi-hole v6 /api/stats/summary response.
const payload = () => ({
  queries: {
    total: 52491,
    blocked: 8643,
    percent_blocked: 16.465679,
    unique_domains: 4211,
    forwarded: 25896,
    cached: 17952,
    frequency: 1.2,
    types: {},
    status: {},
    replies: {},
  },
  clients: { active: 23, total: 30 },
  gravity: { domains_being_blocked: 1234567, last_update: 1758700000 },
  took: 0.003,
});

const INVALID = { name: "PiholeError", code: PIHOLE_ERROR_CODES.INVALID_RESPONSE };

describe("parseSummaryResponse", () => {
  it("maps a valid payload to the domain model", () => {
    expect(parseSummaryResponse(payload())).toEqual({
      queries: {
        total: 52491,
        blocked: 8643,
        percentBlocked: 16.465679,
        cached: 17952,
        forwarded: 25896,
      },
      activeClients: 23,
      gravityDomains: 1234567,
      gravityLastUpdate: 1758700000,
    });
  });

  it("accepts zero counts and percentage bounds", () => {
    const zero = payload();
    Object.assign(zero.queries, { total: 0, blocked: 0, cached: 0, forwarded: 0, percent_blocked: 0 });
    expect(parseSummaryResponse(zero).queries.total).toBe(0);

    const full = payload();
    full.queries.percent_blocked = 100;
    expect(parseSummaryResponse(full).queries.percentBlocked).toBe(100);
  });

  it("passes the gravity timestamp through without validation", () => {
    const data = payload();
    data.gravity.last_update = "not-a-timestamp";
    expect(parseSummaryResponse(data).gravityLastUpdate).toBe("not-a-timestamp");

    delete data.gravity.last_update;
    expect(parseSummaryResponse(data).gravityLastUpdate).toBeUndefined();
  });

  const countFields = [
    ["queries.total", (data) => data.queries, "total"],
    ["queries.blocked", (data) => data.queries, "blocked"],
    ["queries.cached", (data) => data.queries, "cached"],
    ["queries.forwarded", (data) => data.queries, "forwarded"],
    ["clients.active", (data) => data.clients, "active"],
    ["gravity.domains_being_blocked", (data) => data.gravity, "domains_being_blocked"],
  ];
  const invalidCounts = [
    ["missing", undefined],
    ["a string", "10"],
    ["negative", -1],
    ["fractional", 1.5],
    ["NaN", NaN],
    ["infinite", Infinity],
    ["null", null],
  ];

  describe.each(countFields)("%s", (_field, target, key) => {
    it.each(invalidCounts)("rejects a value that is %s", (_case, value) => {
      const data = payload();
      if (value === undefined) delete target(data)[key];
      else target(data)[key] = value;

      expect(() => parseSummaryResponse(data)).toThrow(expect.objectContaining(INVALID));
    });
  });

  it.each([
    ["missing", undefined],
    ["a string", "16.5"],
    ["negative", -0.1],
    ["above 100", 100.1],
    ["NaN", NaN],
    ["infinite", Infinity],
  ])("rejects queries.percent_blocked that is %s", (_case, value) => {
    const data = payload();
    if (value === undefined) delete data.queries.percent_blocked;
    else data.queries.percent_blocked = value;

    expect(() => parseSummaryResponse(data)).toThrow(expect.objectContaining(INVALID));
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty object", {}],
    ["missing queries", { clients: { active: 1 }, gravity: { domains_being_blocked: 1 } }],
  ])("rejects a payload that is %s", (_case, value) => {
    expect(() => parseSummaryResponse(value)).toThrow(expect.objectContaining(INVALID));
  });

  it("uses a static error message", () => {
    const data = payload();
    data.queries.total = "secret-payload-value";

    expect(() => parseSummaryResponse(data)).toThrow("Pi-hole returned an invalid response");
  });
});

describe("parseBlockingState", () => {
  it.each([
    [{ blocking: "enabled" }, "active"],
    [{ blocking: "disabled" }, "disabled"],
    [{ blocking: "failed" }, "unavailable"],
    [{ blocking: "unknown" }, "unavailable"],
    [{ blocking: true }, "unavailable"],
    [{ blocking: "ENABLED" }, "unavailable"],
    [{}, "unavailable"],
    [null, "unavailable"],
    ["enabled", "unavailable"],
  ])("maps %p to %s", (value, expected) => {
    expect(parseBlockingState(value)).toBe(expected);
  });
});

describe("parseMessageCount", () => {
  it.each([[{ count: 3 }, 3], [{ count: 0 }, 0]])("accepts %p", (value, expected) => {
    expect(parseMessageCount(value)).toBe(expected);
  });

  it.each([
    ["negative", { count: -1 }],
    ["fractional", { count: 1.5 }],
    ["a string", { count: "3" }],
    ["missing", {}],
    ["null", null],
  ])("rejects a count that is %s", (_case, value) => {
    expect(() => parseMessageCount(value)).toThrow(expect.objectContaining(INVALID));
  });
});

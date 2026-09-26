import { it, expect } from "vitest";
import { parseBlockingState, parseMessageCount, parseSummaryResponse } from "../summaryParsers.js";

const valid = () => ({
  queries: { total: 10, blocked: 2, percent_blocked: 20, cached: 3, forwarded: 5 },
  clients: { active: 2 },
  gravity: { domains_being_blocked: 100, last_update: 1234567890 },
});

it("maps Pi-hole summary fields without losing zero values", () => {
  const response = valid();
  response.queries.total = 0;
  response.queries.blocked = 0;
  response.queries.percent_blocked = 0;

  expect(parseSummaryResponse(response)).toEqual({
    queries: { total: 0, blocked: 0, percentBlocked: 0, cached: 3, forwarded: 5 },
    activeClients: 2,
    gravityDomains: 100,
    gravityLastUpdate: 1234567890,
  });
});

it.each([
  ["missing required data", null],
  ["a string count", { ...valid(), queries: { ...valid().queries, total: "10" } }],
  ["a negative count", { ...valid(), clients: { active: -1 } }],
  ["an invalid percentage", { ...valid(), queries: { ...valid().queries, percent_blocked: 101 } }],
])("rejects %s with a static error", (_case, response) => {
  expect(() => parseSummaryResponse(response)).toThrow(expect.objectContaining({
    code: "INVALID_RESPONSE", message: "Pi-hole returned an invalid response",
  }));
});

it("maps blocking states and treats unknown states as unavailable", () => {
  expect(parseBlockingState({ blocking: "enabled" })).toBe("active");
  expect(parseBlockingState({ blocking: "disabled" })).toBe("disabled");
  expect(parseBlockingState({ blocking: true })).toBe("unavailable");
});

it("accepts zero messages and rejects malformed counts", () => {
  expect(parseMessageCount({ count: 0 })).toBe(0);
  expect(() => parseMessageCount({ count: "3" })).toThrow(expect.objectContaining({
    code: "INVALID_RESPONSE",
  }));
});

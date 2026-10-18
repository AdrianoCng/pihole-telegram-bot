import { it, expect, beforeEach, vi } from "vitest";
import { API_ENDPOINTS } from "../../../pihole/endpoints.js";
import { authenticatedGet } from "../../../pihole/session.js";
import { logSafeError } from "../../../shared/logSafeError.js";
import { getSummary } from "../service.js";

vi.mock("../../../pihole/session.js");
vi.mock("../../../shared/logSafeError.js");

const summary = {
  queries: { total: 10, blocked: 2, percent_blocked: 20, cached: 3, forwarded: 5 },
  clients: { active: 2 },
  gravity: { domains_being_blocked: 1000, last_update: 1234567890 },
};

function reads({ blocking = { blocking: "enabled" }, count = { count: 3 }, stats = summary } = {}) {
  const results = {
    [API_ENDPOINTS.STATS.SUMMARY]: stats,
    [API_ENDPOINTS.DNS.BLOCKING]: blocking,
    [API_ENDPOINTS.INFO.MESSAGES_COUNT]: count,
  };
  authenticatedGet.mockImplementation(async (path) => {
    if (results[path] instanceof Error) throw results[path];
    return results[path];
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

it("returns a validated summary with supplementary data", async () => {
  reads();

  await expect(getSummary()).resolves.toMatchObject({
    queries: { total: 10, percentBlocked: 20 },
    blockingState: "active",
    messageCount: 3,
  });
});

it("keeps the summary when optional reads fail and logs their endpoints", async () => {
  reads({ blocking: new TypeError("fetch failed"), count: { count: "bad" } });

  await expect(getSummary()).resolves.toMatchObject({
    blockingState: "unavailable",
    messageCount: null,
  });
  expect(logSafeError.mock.calls.map(([details]) => details.path)).toEqual(
    expect.arrayContaining([API_ENDPOINTS.DNS.BLOCKING, API_ENDPOINTS.INFO.MESSAGES_COUNT])
  );
});

it("rejects failed or malformed main summary reads", async () => {
  const failure = new Error("Pi-hole unavailable");
  reads({ stats: failure });
  await expect(getSummary()).rejects.toBe(failure);

  reads({ stats: { ...summary, queries: { ...summary.queries, total: "10" } } });
  await expect(getSummary()).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
});

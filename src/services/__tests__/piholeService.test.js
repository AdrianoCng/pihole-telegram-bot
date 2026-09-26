import { it, expect, beforeEach, vi } from "vitest";
import { API_ENDPOINTS } from "../../constants/api.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import { authenticatedGet, refreshSession } from "../piholeSession.js";
import piholeService from "../piholeService.js";

vi.mock("../piholeSession.js");
vi.mock("../../helpers/logSafeError.js");

const summary = {
  queries: { total: 10, blocked: 2, percent_blocked: 20, cached: 3, forwarded: 5 },
  clients: { active: 2 }, gravity: { domains_being_blocked: 1000, last_update: 1234567890 },
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

beforeEach(() => { vi.resetAllMocks(); });

it("treats an invalid session differently from rejected credentials", async () => {
  refreshSession.mockRejectedValueOnce(new PiholeError({
    code: PIHOLE_ERROR_CODES.INVALID_SESSION, message: "invalid session",
  }));
  await expect(piholeService.authorize()).resolves.toBe(false);

  refreshSession.mockRejectedValueOnce(new PiholeError({
    code: PIHOLE_ERROR_CODES.HTTP, message: "unauthorized", status: 401,
  }));
  await expect(piholeService.authorize()).rejects.toMatchObject({ status: 401 });
});

it("returns a validated summary with supplementary data", async () => {
  reads();

  await expect(piholeService.getSummary()).resolves.toMatchObject({
    queries: { total: 10, percentBlocked: 20 }, blockingState: "active", messageCount: 3,
  });
});

it("keeps the summary when optional reads fail and logs their endpoints", async () => {
  reads({ blocking: new TypeError("fetch failed"), count: { count: "bad" } });

  await expect(piholeService.getSummary()).resolves.toMatchObject({
    blockingState: "unavailable", messageCount: null,
  });
  expect(logSafeError.mock.calls.map(([details]) => details.path)).toEqual(
    expect.arrayContaining([API_ENDPOINTS.DNS.BLOCKING, API_ENDPOINTS.INFO.MESSAGES_COUNT])
  );
});

it("rejects failed or malformed main summary reads", async () => {
  const failure = new Error("Pi-hole unavailable");
  reads({ stats: failure });
  await expect(piholeService.getSummary()).rejects.toBe(failure);

  reads({ stats: { ...summary, queries: { ...summary.queries, total: "10" } } });
  await expect(piholeService.getSummary()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});

it("returns null for malformed Pi-hole messages", async () => {
  authenticatedGet.mockResolvedValue({ messages: "invalid" });
  await expect(piholeService.getMessages()).resolves.toBeNull();
});

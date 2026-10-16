import { it, expect, beforeEach, vi } from "vitest";
import { API_ENDPOINTS } from "../../pihole/endpoints.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../shared/errors/PiholeError.js";
import { logSafeError } from "../../shared/logSafeError.js";
import { authenticatedGet, refreshSession } from "../../pihole/session.js";
import piholeService from "../piholeService.js";
import spawnPiholeCommand from "../../pihole/cli.js";
import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "../../constants/top.js";
import { RECENT_BLOCKED_COUNT } from "../../constants/recent.js";

vi.mock("../../pihole/session.js");
vi.mock("../../shared/logSafeError.js");
vi.mock("../../pihole/cli.js");

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

it("treats an invalid session differently from rejected credentials", async () => {
  refreshSession.mockRejectedValueOnce(
    new PiholeError({
      code: PIHOLE_ERROR_CODES.INVALID_SESSION,
      message: "invalid session",
    })
  );
  await expect(piholeService.authorize()).resolves.toBe(false);

  refreshSession.mockRejectedValueOnce(
    new PiholeError({
      code: PIHOLE_ERROR_CODES.HTTP,
      message: "unauthorized",
      status: 401,
    })
  );
  await expect(piholeService.authorize()).rejects.toMatchObject({ status: 401 });
});

it("returns a validated summary with supplementary data", async () => {
  reads();

  await expect(piholeService.getSummary()).resolves.toMatchObject({
    queries: { total: 10, percentBlocked: 20 },
    blockingState: "active",
    messageCount: 3,
  });
});

it("keeps the summary when optional reads fail and logs their endpoints", async () => {
  reads({ blocking: new TypeError("fetch failed"), count: { count: "bad" } });

  await expect(piholeService.getSummary()).resolves.toMatchObject({
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
  await expect(piholeService.getSummary()).rejects.toBe(failure);

  reads({ stats: { ...summary, queries: { ...summary.queries, total: "10" } } });
  await expect(piholeService.getSummary()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});

it("returns null for malformed Pi-hole messages", async () => {
  authenticatedGet.mockResolvedValue({ messages: "invalid" });
  await expect(piholeService.getMessages()).resolves.toBeNull();
});

it("pauses blocking with a timed Pi-hole disable", async () => {
  const onOutput = vi.fn();

  await piholeService.pause(300, onOutput);

  expect(spawnPiholeCommand).toHaveBeenCalledWith(["disable", "300s"], onOutput);
});

const topDomainsPath = `${API_ENDPOINTS.STATS.TOP_DOMAINS}?blocked=true&count=${TOP_BLOCKED_DOMAINS_COUNT}`;
const topClientsPath = `${API_ENDPOINTS.STATS.TOP_CLIENTS}?count=${TOP_CLIENTS_COUNT}`;

function topReads({
  domains = { domains: [{ domain: "ads.example.com", count: 7 }] },
  clients = { clients: [{ ip: "192.168.1.2", name: "laptop", count: 9 }] },
} = {}) {
  const results = { [topDomainsPath]: domains, [topClientsPath]: clients };
  authenticatedGet.mockImplementation(async (path) => {
    if (results[path] instanceof Error) throw results[path];
    return results[path];
  });
}

it("reads top blocked domains and clients", async () => {
  topReads();

  await expect(piholeService.getTop()).resolves.toEqual({
    topDomains: [{ domain: "ads.example.com", count: 7 }],
    topClients: [{ ip: "192.168.1.2", name: "laptop", count: 9 }],
  });
  expect(authenticatedGet.mock.calls.map(([path]) => path)).toEqual([
    topDomainsPath,
    topClientsPath,
  ]);
});

it("keeps the other top section when one read fails", async () => {
  topReads({ domains: new TypeError("fetch failed") });
  await expect(piholeService.getTop()).resolves.toMatchObject({
    topDomains: null,
    topClients: [{ ip: "192.168.1.2" }],
  });
  expect(logSafeError).toHaveBeenCalledWith(
    expect.objectContaining({ path: API_ENDPOINTS.STATS.TOP_DOMAINS })
  );

  topReads({ clients: { clients: "bad" } });
  await expect(piholeService.getTop()).resolves.toMatchObject({
    topDomains: [{ domain: "ads.example.com" }],
    topClients: null,
  });
});

it("rejects when both top reads fail", async () => {
  const failure = new TypeError("fetch failed");
  topReads({ domains: failure, clients: new Error("clients failed") });

  await expect(piholeService.getTop()).rejects.toBe(failure);
});

const recentPath = `${API_ENDPOINTS.QUERIES}?upstream=blocklist&length=${RECENT_BLOCKED_COUNT}`;

it("reads recently blocked queries", async () => {
  authenticatedGet.mockResolvedValue({
    queries: [
      { time: 1758801600, domain: "ads.example.com", client: { ip: "10.0.0.2", name: null } },
    ],
  });

  await expect(piholeService.getRecentBlocked()).resolves.toEqual([
    { domain: "ads.example.com", time: 1758801600, ip: "10.0.0.2", name: "" },
  ]);
  expect(authenticatedGet).toHaveBeenCalledWith(recentPath);
});

it.each([
  ["client_ip", "192.168.1.5", "client_ip=192.168.1.5"],
  ["client_ip", "fd00::1", "client_ip=fd00%3A%3A1"],
  ["client_name", "my-phone", "client_name=my-phone"],
  ["domain", "ads.example.com", "domain=ads.example.com"],
  ["domain", "a&length=999#x", "domain=a%26length%3D999%23x"],
  ["client_ip", "192.168.1.*", "client_ip=192.168.1.*"],
  ["domain", "*.example.com", "domain=*.example.com"],
])("reads recently blocked queries filtered by %s %j", async (param, value, expected) => {
  authenticatedGet.mockResolvedValue({ queries: [] });

  await expect(piholeService.getRecentBlocked({ param, value })).resolves.toEqual([]);
  expect(authenticatedGet).toHaveBeenCalledWith(`${recentPath}&${expected}`);
});

it("propagates recent read failures", async () => {
  const failure = new TypeError("fetch failed");
  authenticatedGet.mockRejectedValue(failure);

  await expect(piholeService.getRecentBlocked()).rejects.toBe(failure);
});

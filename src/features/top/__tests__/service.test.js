import { it, expect, beforeEach, vi } from "vitest";
import { API_ENDPOINTS } from "../../../pihole/endpoints.js";
import { authenticatedGet } from "../../../pihole/session.js";
import { logSafeError } from "../../../shared/logSafeError.js";
import { TOP_BLOCKED_DOMAINS_COUNT, TOP_CLIENTS_COUNT } from "../constants.js";
import { getTop } from "../service.js";

vi.mock("../../../pihole/session.js");
vi.mock("../../../shared/logSafeError.js");

beforeEach(() => {
  vi.resetAllMocks();
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

  await expect(getTop()).resolves.toEqual({
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
  await expect(getTop()).resolves.toMatchObject({
    topDomains: null,
    topClients: [{ ip: "192.168.1.2" }],
  });
  expect(logSafeError).toHaveBeenCalledWith(
    expect.objectContaining({ path: API_ENDPOINTS.STATS.TOP_DOMAINS })
  );

  topReads({ clients: { clients: "bad" } });
  await expect(getTop()).resolves.toMatchObject({
    topDomains: [{ domain: "ads.example.com" }],
    topClients: null,
  });
});

it("rejects when both top reads fail", async () => {
  const failure = new TypeError("fetch failed");
  topReads({ domains: failure, clients: new Error("clients failed") });

  await expect(getTop()).rejects.toBe(failure);
});

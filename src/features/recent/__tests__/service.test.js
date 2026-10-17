import { it, expect, beforeEach, vi } from "vitest";
import { API_ENDPOINTS } from "../../../pihole/endpoints.js";
import { authenticatedGet } from "../../../pihole/session.js";
import { RECENT_BLOCKED_COUNT } from "../constants.js";
import { getRecentBlocked } from "../service.js";

vi.mock("../../../pihole/session.js");

beforeEach(() => {
  vi.resetAllMocks();
});

const recentPath = `${API_ENDPOINTS.QUERIES}?upstream=blocklist&length=${RECENT_BLOCKED_COUNT}`;

it("reads recently blocked queries", async () => {
  authenticatedGet.mockResolvedValue({
    queries: [
      { time: 1758801600, domain: "ads.example.com", client: { ip: "10.0.0.2", name: null } },
    ],
  });

  await expect(getRecentBlocked()).resolves.toEqual([
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

  await expect(getRecentBlocked({ param, value })).resolves.toEqual([]);
  expect(authenticatedGet).toHaveBeenCalledWith(`${recentPath}&${expected}`);
});

it("propagates recent read failures", async () => {
  const failure = new TypeError("fetch failed");
  authenticatedGet.mockRejectedValue(failure);

  await expect(getRecentBlocked()).rejects.toBe(failure);
});

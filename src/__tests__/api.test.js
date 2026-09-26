import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { mockApiResponse } from "./helpers/testUtils.js";

describe("Pi-hole HTTP client", () => {
  let api;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    api = (await import("../api.js")).default;
  });

  beforeEach(() => {
    global.fetch = vi.fn();
    api.clearSession();
  });

  afterEach(() => {
    api.clearSession();
    global.fetch = originalFetch;
  });

  it("sends JSON to the Pi-hole API and returns the response", async () => {
    global.fetch.mockResolvedValue(mockApiResponse({ ok: true }));

    await expect(api.post("/auth", { password: "example" })).resolves.toEqual({ ok: true });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("http://pihole.test/api/auth");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ password: "example" });
  });

  it("uses the active session for reads and removes it on logout", async () => {
    global.fetch.mockResolvedValue(mockApiResponse(null));
    api.setSession("test-sid");

    await expect(api.get("/stats/summary")).resolves.toBeNull();
    expect(global.fetch.mock.calls[0][1].headers.sid).toBe("test-sid");

    await api.delete("/auth");
    api.clearSession();
    expect(api.hasSession()).toBe(false);
  });

  it("passes an abort signal through to fetch", async () => {
    const signal = new AbortController().signal;
    global.fetch.mockResolvedValue(mockApiResponse({}));

    await api.get("/stats/summary", { signal });

    expect(global.fetch.mock.calls[0][1].signal).toBe(signal);
  });

  it("maps HTTP failures to an error with status and endpoint", async () => {
    global.fetch.mockResolvedValue(mockApiResponse(null, 401, false));

    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      code: "HTTP", status: 401, path: "/stats/summary",
    });
  });
});

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { mockApiResponse } from "../../__tests__/helpers/testUtils.js";

describe("Pi-hole HTTP client", () => {
  let api;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    ({ api } = await import("../client.js"));
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
      name: "ApiAuthError",
      code: "API_AUTH",
      method: "GET",
      status: 401,
      path: "/stats/summary",
    });
  });

  it("keeps the key and hint from Pi-hole's error body", async () => {
    global.fetch.mockResolvedValue(
      mockApiResponse(
        {
          error: {
            key: "database_error",
            message: "Could not add to gravity database",
            hint: "The item is already present",
          },
          took: 0.003,
        },
        400,
        false
      )
    );

    await expect(api.post("/domains/allow/exact", { domain: "example.com" })).rejects.toMatchObject(
      {
        message: "Bad Request",
        status: 400,
        apiError: { key: "database_error", hint: "The item is already present" },
      }
    );
  });

  it("omits the API error when the error body is empty or not JSON", async () => {
    global.fetch.mockResolvedValueOnce(mockApiResponse(null, 400, false));
    global.fetch.mockResolvedValueOnce({
      ...mockApiResponse(null, 500, false),
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    });

    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      status: 400,
      apiError: undefined,
    });
    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      status: 500,
      apiError: undefined,
    });
  });

  it("wraps a failed fetch as unreachable and keeps the cause", async () => {
    const cause = new TypeError("fetch failed");
    global.fetch.mockRejectedValue(cause);

    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      name: "ApiUnreachableError",
      code: "API_UNREACHABLE",
      method: "GET",
      path: "/stats/summary",
      cause,
    });
  });

  it("reports a successful response that is not JSON as invalid", async () => {
    const cause = new SyntaxError("Unexpected token");
    global.fetch.mockResolvedValue({
      ...mockApiResponse({}),
      json: () => Promise.reject(cause),
    });

    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      name: "ApiResponseError",
      code: "API_INVALID_RESPONSE",
      method: "GET",
      path: "/stats/summary",
      cause,
    });
  });

  it.each([
    ["TimeoutError", new DOMException("The operation timed out", "TimeoutError")],
    ["AbortError", new DOMException("The operation was aborted", "AbortError")],
    ["TypeError", new TypeError("terminated")],
  ])("reports a body read that fails with %s as unreachable", async (_name, cause) => {
    global.fetch.mockResolvedValue({
      ...mockApiResponse({}),
      json: () => Promise.reject(cause),
    });

    await expect(api.get("/stats/summary")).rejects.toMatchObject({
      name: "ApiUnreachableError",
      code: "API_UNREACHABLE",
      method: "GET",
      path: "/stats/summary",
      cause,
    });
  });

  it("reports other HTTP failures as a generic API error", async () => {
    global.fetch.mockResolvedValue(mockApiResponse(null, 500, false));

    await expect(api.post("/action/gravity", {})).rejects.toMatchObject({
      name: "ApiError",
      code: "API",
      method: "POST",
      status: 500,
      message: "Internal Server Error",
    });
  });
});

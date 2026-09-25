import api from "../../api.js";
import { API_ENDPOINTS } from "../../constants/api.js";
import { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { mockApiResponse } from "../../__tests__/helpers/testUtils.js";
import {
  authenticatedGet,
  endSession,
  ensureSession,
  refreshSession,
  resetSessionState,
} from "../piholeSession.js";

const PASSWORD = "test-password";
const AUTH_URL = `${api.BASE_URL}${API_ENDPOINTS.AUTH}`;
const validAuth = (sid = "fresh-sid") => mockApiResponse({ session: { valid: true, sid } });
const unauthorized = () => mockApiResponse(null, 401, false);

function authCalls() {
  return fetch.mock.calls.filter(([url, init]) => url === AUTH_URL && init.method === "POST");
}

describe("piholeSession", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, PIHOLE_PASSWORD: PASSWORD };
    global.fetch = jest.fn();
    api.headers = {};
    resetSessionState();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    api.headers = {};
  });

  describe("ensureSession", () => {
    it("authenticates exactly once when no SID exists", async () => {
      fetch.mockResolvedValueOnce(validAuth());

      await ensureSession();

      expect(authCalls()).toHaveLength(1);
      expect(JSON.parse(authCalls()[0][1].body)).toEqual({ password: PASSWORD });
      expect(api.headers.sid).toBe("fresh-sid");
    });

    it("reuses an existing SID", async () => {
      api.setSession("existing-sid");

      await ensureSession();

      expect(fetch).not.toHaveBeenCalled();
    });

    it("treats an empty-string SID as no session", async () => {
      api.setHeader("sid", "");
      fetch.mockResolvedValueOnce(validAuth());

      await ensureSession();

      expect(authCalls()).toHaveLength(1);
    });

    it("joins an in-flight refresh", async () => {
      let resolveAuth;
      fetch.mockReturnValueOnce(new Promise((resolve) => { resolveAuth = resolve; }));

      const first = refreshSession();
      const second = ensureSession();
      resolveAuth(validAuth());
      await Promise.all([first, second]);

      expect(authCalls()).toHaveLength(1);
    });

    it("reads the password only when authentication runs", async () => {
      delete process.env.PIHOLE_PASSWORD;
      api.setSession("existing-sid");
      await expect(ensureSession()).resolves.toBeUndefined();

      api.clearSession();
      await expect(ensureSession()).rejects.toThrow(
        "Missing required environment variable: PIHOLE_PASSWORD"
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it.each([
      null,
      {},
      { session: { valid: false, sid: "sid" } },
      { session: { valid: true } },
      { session: { valid: true, sid: "" } },
      { session: { valid: true, sid: 42 } },
    ])("rejects an invalid session payload %# without storing a SID", async (payload) => {
      fetch.mockResolvedValueOnce(mockApiResponse(payload));

      await expect(refreshSession()).rejects.toMatchObject({
        code: PIHOLE_ERROR_CODES.INVALID_SESSION,
      });
      expect(api.hasSession()).toBe(false);
    });

    it("propagates rejected credentials", async () => {
      fetch.mockResolvedValueOnce(unauthorized());

      await expect(refreshSession()).rejects.toMatchObject({ status: 401 });
    });

    it("clears the in-flight refresh after a failure", async () => {
      fetch.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(validAuth());

      await expect(refreshSession()).rejects.toThrow("fetch failed");
      await expect(refreshSession()).resolves.toBeUndefined();

      expect(authCalls()).toHaveLength(2);
      expect(api.headers.sid).toBe("fresh-sid");
    });

    it("never includes the password or SID in thrown errors", async () => {
      fetch.mockResolvedValueOnce(mockApiResponse({ session: { valid: false, sid: "secret-sid" } }));

      const error = await refreshSession().catch((e) => e);

      expect(`${error.message} ${error.stack}`).not.toMatch(/test-password|secret-sid/);
    });
  });

  describe("authenticatedGet", () => {
    it("authenticates before the first read", async () => {
      fetch.mockResolvedValueOnce(validAuth()).mockResolvedValueOnce(mockApiResponse({ ok: 1 }));

      await expect(authenticatedGet("/data")).resolves.toEqual({ ok: 1 });

      expect(fetch.mock.calls.map(([url]) => url)).toEqual([AUTH_URL, `${api.BASE_URL}/data`]);
      expect(fetch.mock.calls[1][1].headers).toEqual({ sid: "fresh-sid" });
    });

    it("refreshes once and retries once after a 401", async () => {
      api.setSession("expired-sid");
      fetch
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValueOnce(validAuth())
        .mockResolvedValueOnce(mockApiResponse({ ok: 1 }));

      await expect(authenticatedGet("/data")).resolves.toEqual({ ok: 1 });

      expect(authCalls()).toHaveLength(1);
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch.mock.calls[2][1].headers).toEqual({ sid: "fresh-sid" });
    });

    it("propagates a second 401 without another retry", async () => {
      api.setSession("expired-sid");
      fetch
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValueOnce(validAuth())
        .mockResolvedValueOnce(unauthorized());

      await expect(authenticatedGet("/data")).rejects.toMatchObject({
        status: 401,
        afterRetry: true,
      });
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("shares one refresh between concurrent 401 responses", async () => {
      api.setSession("expired-sid");
      fetch.mockImplementation(async (url, init) => {
        if (url === AUTH_URL) return validAuth();
        return init.headers.sid === "fresh-sid" ? mockApiResponse({ url }) : unauthorized();
      });

      const results = await Promise.all(["/a", "/b", "/c"].map((path) => authenticatedGet(path)));

      expect(results).toHaveLength(3);
      expect(authCalls()).toHaveLength(1);
    });

    it("reuses a newer session when another caller already refreshed", async () => {
      api.setSession("expired-sid");
      let releaseSlow;
      fetch.mockImplementation(async (url, init) => {
        if (url === AUTH_URL) return validAuth();
        if (url.endsWith("/slow") && init.headers.sid === "expired-sid") {
          await new Promise((resolve) => { releaseSlow = resolve; });
          return unauthorized();
        }
        return init.headers.sid === "fresh-sid" ? mockApiResponse({}) : unauthorized();
      });

      const slow = authenticatedGet("/slow");
      await authenticatedGet("/fast");
      releaseSlow();
      await slow;

      expect(authCalls()).toHaveLength(1);
    });

    it.each([
      ["timeout", new DOMException("timed out", "TimeoutError")],
      ["network", new TypeError("fetch failed")],
      ["server", null],
    ])("does not retry %s failures", async (_label, error) => {
      api.setSession("sid");
      if (error) fetch.mockRejectedValueOnce(error);
      else fetch.mockResolvedValueOnce(mockApiResponse(null, 500, false));

      await expect(authenticatedGet("/data")).rejects.toBeDefined();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("rethrows non-object retry failures unchanged", async () => {
      api.setSession("expired-sid");
      fetch
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValueOnce(validAuth())
        .mockRejectedValueOnce("boom");

      await expect(authenticatedGet("/data")).rejects.toBe("boom");
    });

    it("applies the caller signal to authentication, the read, and the retry", async () => {
      const controller = new AbortController();
      fetch
        .mockResolvedValueOnce(validAuth())
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValueOnce(validAuth("second-sid"))
        .mockResolvedValueOnce(mockApiResponse({}));

      await authenticatedGet("/data", { signal: controller.signal });

      expect(fetch).toHaveBeenCalledTimes(4);
      const signals = fetch.mock.calls.map(([, init]) => init.signal);
      signals.forEach((signal) => expect(signal.aborted).toBe(false));
      controller.abort();
      signals.forEach((signal) => expect(signal.aborted).toBe(true));
    });

    it("bounds each request with a timeout when no caller signal is given", async () => {
      api.setSession("sid");
      fetch.mockResolvedValueOnce(mockApiResponse({}));

      await authenticatedGet("/data");

      expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("endSession", () => {
    it("clears the SID after Pi-hole ends the session", async () => {
      api.setSession("sid");
      fetch.mockResolvedValueOnce(mockApiResponse(null));

      await endSession();

      expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.objectContaining({ method: "DELETE" }));
      expect(api.hasSession()).toBe(false);
    });

    it("keeps the SID when logout fails", async () => {
      api.setSession("sid");
      fetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      await expect(endSession()).rejects.toThrow("fetch failed");
      expect(api.headers.sid).toBe("sid");
    });
  });
});

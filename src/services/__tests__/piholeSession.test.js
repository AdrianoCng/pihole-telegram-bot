import api from "../../api.js";
import { API_ENDPOINTS } from "../../constants/api.js";
import { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { mockApiResponse } from "../../__tests__/helpers/testUtils.js";
import {
  authenticatedGet,
  endSession,
  ensureSession,
  refreshSession,
} from "../piholeSession.js";

const PASSWORD = "test-password";
const AUTH_URL = `${api.BASE_URL}${API_ENDPOINTS.AUTH}`;
const READ_PATH = "/stats/summary";
const READ_URL = `${api.BASE_URL}${READ_PATH}`;

const validSession = (sid = "test-sid") => ({ session: { valid: true, sid } });

/** Route fetch calls by method and URL to queued responses. */
function routeFetch(routes) {
  global.fetch.mockImplementation(async (url, options = {}) => {
    const key = `${options.method ?? "GET"} ${url}`;
    const queue = routes[key];
    if (!queue?.length) throw new Error(`Unexpected request: ${key}`);
    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next(options) : next;
  });
}

const authCalls = () =>
  global.fetch.mock.calls.filter(([url, options]) => url === AUTH_URL && options.method === "POST");
const readCalls = () => global.fetch.mock.calls.filter(([url]) => url === READ_URL);

describe("piholeSession", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, PIHOLE_PASSWORD: PASSWORD };
    global.fetch = jest.fn();
    api.headers = {};
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    api.headers = {};
  });

  describe("ensureSession", () => {
    it("authenticates exactly once when no session exists", async () => {
      routeFetch({ [`POST ${AUTH_URL}`]: [mockApiResponse(validSession())] });

      await ensureSession();

      expect(authCalls()).toHaveLength(1);
      expect(JSON.parse(authCalls()[0][1].body)).toEqual({ password: PASSWORD });
      expect(api.headers.sid).toBe("test-sid");
    });

    it("skips authentication when a session exists", async () => {
      api.setSession("existing-sid");

      await ensureSession();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("does not treat an empty sid as a session", async () => {
      api.headers.sid = "";
      routeFetch({ [`POST ${AUTH_URL}`]: [mockApiResponse(validSession())] });

      await ensureSession();

      expect(authCalls()).toHaveLength(1);
    });

    it("waits for an in-flight refresh instead of starting another", async () => {
      routeFetch({ [`POST ${AUTH_URL}`]: [mockApiResponse(validSession())] });

      await Promise.all([refreshSession(), ensureSession(), ensureSession()]);

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
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it.each([
      ["no body", null],
      ["no session", {}],
      ["an invalid session", { session: { valid: false, sid: "test-sid" } }],
      ["a missing sid", { session: { valid: true } }],
      ["an empty sid", { session: { valid: true, sid: "" } }],
      ["a non-string sid", { session: { valid: true, sid: 42 } }],
    ])("rejects a response with %s and stores no session", async (_case, body) => {
      routeFetch({ [`POST ${AUTH_URL}`]: [mockApiResponse(body)] });

      await expect(refreshSession()).rejects.toMatchObject({
        name: "PiholeError",
        code: PIHOLE_ERROR_CODES.INVALID_SESSION,
      });
      expect(api.hasSession()).toBe(false);
    });

    it("propagates rejected credentials", async () => {
      routeFetch({ [`POST ${AUTH_URL}`]: [mockApiResponse(null, 401, false)] });

      await expect(refreshSession()).rejects.toMatchObject({ status: 401 });
      expect(api.hasSession()).toBe(false);
    });

    it("clears the in-flight promise after a failed refresh", async () => {
      routeFetch({
        [`POST ${AUTH_URL}`]: [new TypeError("fetch failed"), mockApiResponse(validSession())],
      });

      await expect(refreshSession()).rejects.toThrow("fetch failed");
      await expect(refreshSession()).resolves.toBeUndefined();

      expect(authCalls()).toHaveLength(2);
      expect(api.hasSession()).toBe(true);
    });

    it("never exposes the password or sid in errors", async () => {
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse({ session: { valid: false, sid: "secret-sid" } })],
      });

      const error = await refreshSession().catch((err) => err);

      expect(`${error.message} ${JSON.stringify(error)}`).not.toMatch(/test-password|secret-sid/);
    });
  });

  describe("authenticatedGet", () => {
    it("authenticates before the first read", async () => {
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession())],
        [`GET ${READ_URL}`]: [mockApiResponse({ ok: true })],
      });

      await expect(authenticatedGet(READ_PATH)).resolves.toEqual({ ok: true });

      expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([AUTH_URL, READ_URL]);
      expect(readCalls()[0][1].headers).toEqual({ sid: "test-sid" });
    });

    it("refreshes once and retries once after a 401", async () => {
      api.setSession("expired-sid");
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession("fresh-sid"))],
        [`GET ${READ_URL}`]: [mockApiResponse(null, 401, false), mockApiResponse({ ok: true })],
      });

      await expect(authenticatedGet(READ_PATH)).resolves.toEqual({ ok: true });

      expect(authCalls()).toHaveLength(1);
      expect(readCalls()).toHaveLength(2);
      expect(readCalls()[1][1].headers).toEqual({ sid: "fresh-sid" });
    });

    it("propagates a second 401 without another retry", async () => {
      api.setSession("expired-sid");
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession("fresh-sid"))],
        [`GET ${READ_URL}`]: [mockApiResponse(null, 401, false)],
      });

      await expect(authenticatedGet(READ_PATH)).rejects.toMatchObject({
        status: 401,
        afterRetry: true,
      });

      expect(authCalls()).toHaveLength(1);
      expect(readCalls()).toHaveLength(2);
    });

    it("shares one refresh between concurrent 401 responses", async () => {
      api.setSession("expired-sid");
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession("fresh-sid"))],
        [`GET ${READ_URL}`]: [
          (options) => mockApiResponse(null, options.headers.sid === "fresh-sid" ? 200 : 401, options.headers.sid === "fresh-sid"),
        ],
      });

      await Promise.all([
        authenticatedGet(READ_PATH),
        authenticatedGet(READ_PATH),
        authenticatedGet(READ_PATH),
      ]);

      expect(authCalls()).toHaveLength(1);
      expect(readCalls()).toHaveLength(6);
    });

    it("reuses a newer session instead of refreshing again", async () => {
      api.setSession("expired-sid");
      let releaseRead;
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession("fresh-sid"))],
        [`GET ${READ_URL}`]: [
          () => new Promise((resolve) => { releaseRead = () => resolve(mockApiResponse(null, 401, false)); }),
          mockApiResponse({ ok: true }),
        ],
      });

      const slowRead = authenticatedGet(READ_PATH);
      await new Promise((resolve) => setImmediate(resolve));
      await refreshSession();
      releaseRead();

      await expect(slowRead).resolves.toEqual({ ok: true });
      expect(authCalls()).toHaveLength(1);
    });

    it.each([
      ["timeouts", new DOMException("The operation timed out.", "TimeoutError")],
      ["network failures", new TypeError("fetch failed")],
      ["server errors", mockApiResponse(null, 500, false)],
    ])("does not retry %s", async (_case, failure) => {
      api.setSession("test-sid");
      routeFetch({ [`GET ${READ_URL}`]: [failure] });

      await expect(authenticatedGet(READ_PATH)).rejects.toBeDefined();

      expect(readCalls()).toHaveLength(1);
      expect(authCalls()).toHaveLength(0);
    });

    it("passes an abort signal to authentication, the read, and the retry", async () => {
      const controller = new AbortController();
      routeFetch({
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession())],
        [`GET ${READ_URL}`]: [mockApiResponse(null, 401, false), mockApiResponse({ ok: true })],
      });

      await authenticatedGet(READ_PATH, { signal: controller.signal });

      const signals = global.fetch.mock.calls.map(([, options]) => options.signal);
      expect(signals).toHaveLength(4);
      expect(signals.every((signal) => signal instanceof AbortSignal)).toBe(true);

      controller.abort();
      expect(signals.every((signal) => signal.aborted)).toBe(true);
    });

    it("applies a per-request timeout without a caller signal", async () => {
      api.setSession("test-sid");
      routeFetch({ [`GET ${READ_URL}`]: [mockApiResponse({ ok: true })] });

      await authenticatedGet(READ_PATH);

      const [[, { signal }]] = global.fetch.mock.calls;
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it("rejects when the caller's deadline aborts a stalled request", async () => {
      api.setSession("test-sid");
      routeFetch({
        [`GET ${READ_URL}`]: [
          (options) => new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => reject(options.signal.reason));
          }),
        ],
      });

      await expect(
        authenticatedGet(READ_PATH, { signal: AbortSignal.timeout(50) })
      ).rejects.toMatchObject({ name: "TimeoutError" });
    });
  });

  describe("endSession", () => {
    it("clears the session after a successful logout", async () => {
      api.setSession("test-sid");
      routeFetch({ [`DELETE ${AUTH_URL}`]: [mockApiResponse(null)] });

      await endSession();

      expect(global.fetch).toHaveBeenCalledWith(
        AUTH_URL,
        expect.objectContaining({ method: "DELETE", headers: { sid: "test-sid" } })
      );
      expect(api.hasSession()).toBe(false);
    });

    it("keeps the session when logout fails", async () => {
      api.setSession("test-sid");
      routeFetch({ [`DELETE ${AUTH_URL}`]: [new TypeError("fetch failed")] });

      await expect(endSession()).rejects.toThrow("fetch failed");
      expect(api.hasSession()).toBe(true);
    });

    it("forces a new authentication after logout", async () => {
      api.setSession("test-sid");
      routeFetch({
        [`DELETE ${AUTH_URL}`]: [mockApiResponse(null)],
        [`POST ${AUTH_URL}`]: [mockApiResponse(validSession("next-sid"))],
      });

      await endSession();
      await ensureSession();

      expect(api.headers.sid).toBe("next-sid");
    });
  });
});

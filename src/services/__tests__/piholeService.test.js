import { API_ENDPOINTS } from "../../constants/api.js";
import { CLI_COMMANDS } from "../../constants/cli.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import spawnPiholeCommand from "../../helpers/spawnPiholeCommand.js";
import {
  authenticatedGet,
  endSession,
  refreshSession,
} from "../piholeSession.js";
import piholeService from "../piholeService.js";

jest.mock("../piholeSession.js");
jest.mock("../../helpers/logSafeError.js");
jest.mock("../../helpers/spawnPiholeCommand.js");

const SUMMARY_PAYLOAD = {
  queries: {
    total: 52491,
    blocked: 8643,
    percent_blocked: 16.465679,
    cached: 17952,
    forwarded: 25896,
  },
  clients: { active: 23, total: 30 },
  gravity: { domains_being_blocked: 1234567, last_update: 1758700000 },
};

const invalidResponse = () =>
  new PiholeError({
    code: PIHOLE_ERROR_CODES.INVALID_RESPONSE,
    message: "Pi-hole returned an invalid response",
  });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockReads({ summary, blocking, count }) {
  const responses = {
    [API_ENDPOINTS.STATS.SUMMARY]: summary,
    [API_ENDPOINTS.DNS.BLOCKING]: blocking,
    [API_ENDPOINTS.INFO.MESSAGES_COUNT]: count,
  };

  authenticatedGet.mockImplementation(async (path) => {
    const response = responses[path];
    if (response instanceof Error) throw response;
    return response;
  });
}

describe("piholeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authorize", () => {
    it("creates a Pi-hole session", async () => {
      refreshSession.mockResolvedValue();

      await expect(piholeService.authorize()).resolves.toBe(true);
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it("returns false for an invalid session response", async () => {
      refreshSession.mockRejectedValue(
        new PiholeError({
          code: PIHOLE_ERROR_CODES.INVALID_SESSION,
          message: "Pi-hole returned an invalid session",
        })
      );

      await expect(piholeService.authorize()).resolves.toBe(false);
    });

    it("propagates rejected credentials and configuration errors", async () => {
      const unauthorized = new PiholeError({
        code: PIHOLE_ERROR_CODES.HTTP,
        message: "Unauthorized",
        status: 401,
      });
      refreshSession.mockRejectedValueOnce(unauthorized);
      await expect(piholeService.authorize()).rejects.toBe(unauthorized);

      refreshSession.mockRejectedValueOnce(
        new Error("Missing required environment variable: PIHOLE_PASSWORD")
      );
      await expect(piholeService.authorize()).rejects.toThrow("PIHOLE_PASSWORD");
    });
  });

  describe("logout", () => {
    it("ends the session with the given signal", async () => {
      const signal = new AbortController().signal;
      endSession.mockResolvedValue();

      await piholeService.logout({ signal });

      expect(endSession).toHaveBeenCalledWith({ signal });
    });

    it("propagates logout failures", async () => {
      endSession.mockRejectedValue(new Error("logout failed"));

      await expect(piholeService.logout()).rejects.toThrow("logout failed");
    });
  });

  describe("getMessages", () => {
    it("reads messages through an authenticated request", async () => {
      const messages = [{ timestamp: 1, plain: "message" }];
      authenticatedGet.mockResolvedValue({ messages });

      await expect(piholeService.getMessages()).resolves.toBe(messages);
      expect(authenticatedGet).toHaveBeenCalledWith(API_ENDPOINTS.INFO.MESSAGES);
    });

    it.each([null, {}, { messages: "invalid" }])(
      "returns null for an invalid messages response %#",
      async (response) => {
        authenticatedGet.mockResolvedValue(response);
        await expect(piholeService.getMessages()).resolves.toBeNull();
      }
    );
  });

  describe("getSummary", () => {
    it("returns the validated domain model", async () => {
      mockReads({ summary: SUMMARY_PAYLOAD, blocking: { blocking: "enabled" }, count: { count: 2 } });

      await expect(piholeService.getSummary()).resolves.toEqual({
        blockingState: "active",
        queries: {
          total: 52491,
          blocked: 8643,
          percentBlocked: 16.465679,
          cached: 17952,
          forwarded: 25896,
        },
        activeClients: 23,
        gravityDomains: 1234567,
        gravityLastUpdate: 1758700000,
        messageCount: 2,
      });
      expect(logSafeError).not.toHaveBeenCalled();
    });

    it("starts all authenticated reads concurrently", async () => {
      const reads = {};
      authenticatedGet.mockImplementation((path) => {
        reads[path] = deferred();
        return reads[path].promise;
      });

      const result = piholeService.getSummary();
      await Promise.resolve();

      expect(Object.keys(reads)).toEqual([
        API_ENDPOINTS.STATS.SUMMARY,
        API_ENDPOINTS.DNS.BLOCKING,
        API_ENDPOINTS.INFO.MESSAGES_COUNT,
      ]);
      const [[, { signal }]] = authenticatedGet.mock.calls;
      expect(authenticatedGet.mock.calls.every(([, options]) => options.signal === signal)).toBe(true);

      reads[API_ENDPOINTS.INFO.MESSAGES_COUNT].resolve({ count: 0 });
      reads[API_ENDPOINTS.DNS.BLOCKING].resolve({ blocking: "disabled" });
      reads[API_ENDPOINTS.STATS.SUMMARY].resolve(SUMMARY_PAYLOAD);

      await expect(result).resolves.toMatchObject({ blockingState: "disabled", messageCount: 0 });
    });

    it.each([
      ["a rejected", new TypeError("fetch failed")],
      ["a malformed", { blocking: true }],
    ])("reports blocking as unavailable after %s blocking response", async (_case, blocking) => {
      mockReads({ summary: SUMMARY_PAYLOAD, blocking, count: { count: 0 } });

      await expect(piholeService.getSummary()).resolves.toMatchObject({
        blockingState: "unavailable",
      });
    });

    it("logs a rejected blocking response safely", async () => {
      const error = new TypeError("fetch failed");
      mockReads({ summary: SUMMARY_PAYLOAD, blocking: error, count: { count: 0 } });

      await piholeService.getSummary();

      expect(logSafeError).toHaveBeenCalledWith({
        operation: "blocking",
        path: API_ENDPOINTS.DNS.BLOCKING,
        error,
      });
    });

    it.each([
      ["a rejected", new PiholeError({ code: PIHOLE_ERROR_CODES.HTTP, message: "Not Found", status: 404 })],
      ["a malformed", { count: -1 }],
    ])("omits the message count after %s count response", async (_case, count) => {
      mockReads({ summary: SUMMARY_PAYLOAD, blocking: { blocking: "enabled" }, count });

      await expect(piholeService.getSummary()).resolves.toMatchObject({
        blockingState: "active",
        messageCount: null,
      });
      expect(logSafeError).toHaveBeenCalledWith(
        expect.objectContaining({ operation: "messages-count", path: API_ENDPOINTS.INFO.MESSAGES_COUNT })
      );
    });

    it("propagates the original error when the summary read fails", async () => {
      const error = new PiholeError({
        code: PIHOLE_ERROR_CODES.HTTP,
        message: "Internal Server Error",
        status: 500,
      });
      mockReads({ summary: error, blocking: { blocking: "enabled" }, count: { count: 0 } });

      await expect(piholeService.getSummary()).rejects.toBe(error);
    });

    it("rejects a malformed summary instead of defaulting metrics", async () => {
      mockReads({
        summary: { ...SUMMARY_PAYLOAD, queries: { ...SUMMARY_PAYLOAD.queries, total: "52491" } },
        blocking: { blocking: "enabled" },
        count: { count: 0 },
      });

      await expect(piholeService.getSummary()).rejects.toMatchObject(invalidResponse());
    });

    it("aborts stalled reads at the command deadline", async () => {
      authenticatedGet.mockImplementation(
        (_path, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason));
          })
      );

      await expect(piholeService.getSummary({ deadlineMs: 50 })).rejects.toMatchObject({
        name: "TimeoutError",
      });
    });
  });

  it.each([
    ["getStatus", CLI_COMMANDS.STATUS],
    ["enable", CLI_COMMANDS.ENABLE],
    ["disable", CLI_COMMANDS.DISABLE],
    ["getVersion", CLI_COMMANDS.VERSION],
    ["update", CLI_COMMANDS.UPDATE],
    ["updateGravity", CLI_COMMANDS.UPGRAVITY],
  ])("runs %s through the Pi-hole command executor", async (method, command) => {
    const onOutput = jest.fn();
    spawnPiholeCommand.mockResolvedValue();

    await piholeService[method](onOutput);

    expect(spawnPiholeCommand).toHaveBeenCalledWith([command], onOutput);
  });
});

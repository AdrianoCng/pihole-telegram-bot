import { API_ENDPOINTS, SUMMARY_DEADLINE_MS } from "../../constants/api.js";
import { CLI_COMMANDS } from "../../constants/cli.js";
import ApiError from "../../errors/ApiError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import spawnPiholeCommand from "../../helpers/spawnPiholeCommand.js";
import {
  authenticatedGet,
  endSession,
  ensureSession,
  refreshSession,
} from "../piholeSession.js";
import piholeService from "../piholeService.js";

jest.mock("../piholeSession.js");
jest.mock("../../helpers/logSafeError.js");
jest.mock("../../helpers/spawnPiholeCommand.js");

const SUMMARY_PAYLOAD = {
  queries: { total: 100, blocked: 20, percent_blocked: 20, cached: 30, forwarded: 50 },
  clients: { active: 4 },
  gravity: { domains_being_blocked: 1000, last_update: 1700000000 },
};

const PARSED_SUMMARY = {
  queries: { total: 100, blocked: 20, percentBlocked: 20, cached: 30, forwarded: 50 },
  activeClients: 4,
  gravityDomains: 1000,
  gravityLastUpdate: 1700000000,
};

function mockReads(responses) {
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
    it("refreshes the Pi-hole session", async () => {
      refreshSession.mockResolvedValue();

      await expect(piholeService.authorize()).resolves.toBe(true);
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it("returns false for an invalid session response", async () => {
      refreshSession.mockRejectedValue(new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION));

      await expect(piholeService.authorize()).resolves.toBe(false);
    });

    it("propagates API and configuration errors", async () => {
      const error = new ApiError(401, "Unauthorized");
      refreshSession.mockRejectedValue(error);

      await expect(piholeService.authorize()).rejects.toBe(error);
    });
  });

  describe("logout", () => {
    it("ends the session, forwarding an optional signal", async () => {
      const { signal } = new AbortController();

      await piholeService.logout();
      await piholeService.logout({ signal });

      expect(endSession).toHaveBeenNthCalledWith(1, { signal: undefined });
      expect(endSession).toHaveBeenNthCalledWith(2, { signal });
    });

    it("propagates logout failures", async () => {
      endSession.mockRejectedValue(new Error("logout failed"));

      await expect(piholeService.logout()).rejects.toThrow("logout failed");
    });
  });

  describe("getMessages", () => {
    it("reads messages through the authenticated session", async () => {
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
    it("establishes a session, then starts all reads concurrently", async () => {
      const deferred = {};
      authenticatedGet.mockImplementation((path) => new Promise((resolve) => {
        deferred[path] = resolve;
      }));

      const result = piholeService.getSummary();
      await new Promise(setImmediate);

      expect(ensureSession).toHaveBeenCalledTimes(1);
      expect(ensureSession.mock.invocationCallOrder[0])
        .toBeLessThan(authenticatedGet.mock.invocationCallOrder[0]);
      expect(Object.keys(deferred)).toEqual([
        API_ENDPOINTS.STATS.SUMMARY,
        API_ENDPOINTS.DNS.BLOCKING,
        API_ENDPOINTS.INFO.MESSAGES_COUNT,
      ]);

      const { signal } = ensureSession.mock.calls[0][0];
      expect(signal).toBeInstanceOf(AbortSignal);
      authenticatedGet.mock.calls.forEach(([, options]) => expect(options.signal).toBe(signal));

      deferred[API_ENDPOINTS.INFO.MESSAGES_COUNT]({ count: 2 });
      deferred[API_ENDPOINTS.DNS.BLOCKING]({ blocking: "enabled" });
      deferred[API_ENDPOINTS.STATS.SUMMARY](SUMMARY_PAYLOAD);

      await expect(result).resolves.toEqual({
        ...PARSED_SUMMARY,
        blockingState: "active",
        messageCount: 2,
      });
      expect(logSafeError).not.toHaveBeenCalled();
    });

    it("uses the default command deadline", async () => {
      const timeout = jest.spyOn(AbortSignal, "timeout");
      mockReads({
        [API_ENDPOINTS.STATS.SUMMARY]: SUMMARY_PAYLOAD,
        [API_ENDPOINTS.DNS.BLOCKING]: { blocking: "disabled" },
        [API_ENDPOINTS.INFO.MESSAGES_COUNT]: { count: 0 },
      });

      try {
        await expect(piholeService.getSummary()).resolves.toMatchObject({
          blockingState: "disabled",
          messageCount: 0,
        });
        expect(timeout).toHaveBeenCalledWith(SUMMARY_DEADLINE_MS);
      } finally {
        timeout.mockRestore();
      }
    });

    it.each([
      ["a rejected", new TypeError("fetch failed")],
      ["a malformed", { count: -1 }],
    ])("omits the message count after %s count response", async (_label, response) => {
      mockReads({
        [API_ENDPOINTS.STATS.SUMMARY]: SUMMARY_PAYLOAD,
        [API_ENDPOINTS.DNS.BLOCKING]: { blocking: "enabled" },
        [API_ENDPOINTS.INFO.MESSAGES_COUNT]: response,
      });

      await expect(piholeService.getSummary()).resolves.toMatchObject({
        blockingState: "active",
        messageCount: null,
      });
      expect(logSafeError).toHaveBeenCalledWith(expect.objectContaining({
        operation: "messages-count",
        path: API_ENDPOINTS.INFO.MESSAGES_COUNT,
      }));
    });

    it.each([
      ["a rejected", new ApiError(500, "Internal Server Error"), true],
      ["a failed", { blocking: "failed" }, false],
      ["a malformed", null, false],
    ])("reports blocking as unavailable after %s blocking response", async (_label, response, logged) => {
      mockReads({
        [API_ENDPOINTS.STATS.SUMMARY]: SUMMARY_PAYLOAD,
        [API_ENDPOINTS.DNS.BLOCKING]: response,
        [API_ENDPOINTS.INFO.MESSAGES_COUNT]: { count: 1 },
      });

      await expect(piholeService.getSummary()).resolves.toMatchObject({
        blockingState: "unavailable",
        messageCount: 1,
      });
      expect(logSafeError).toHaveBeenCalledTimes(logged ? 1 : 0);
    });

    it("propagates the original error when the summary read fails", async () => {
      const error = new ApiError(401, "Unauthorized");
      mockReads({
        [API_ENDPOINTS.STATS.SUMMARY]: error,
        [API_ENDPOINTS.DNS.BLOCKING]: { blocking: "enabled" },
        [API_ENDPOINTS.INFO.MESSAGES_COUNT]: { count: 0 },
      });

      await expect(piholeService.getSummary()).rejects.toBe(error);
    });

    it("rejects a malformed summary without returning metrics", async () => {
      mockReads({
        [API_ENDPOINTS.STATS.SUMMARY]: { ...SUMMARY_PAYLOAD, clients: {} },
        [API_ENDPOINTS.DNS.BLOCKING]: { blocking: "enabled" },
        [API_ENDPOINTS.INFO.MESSAGES_COUNT]: { count: 0 },
      });

      await expect(piholeService.getSummary()).rejects.toMatchObject({
        code: PIHOLE_ERROR_CODES.INVALID_RESPONSE,
      });
    });

    it("propagates session failures before reading", async () => {
      const error = new PiholeError(PIHOLE_ERROR_CODES.INVALID_SESSION);
      ensureSession.mockRejectedValueOnce(error);

      await expect(piholeService.getSummary()).rejects.toBe(error);
      expect(authenticatedGet).not.toHaveBeenCalled();
    });

    it("aborts a stalled read at the command deadline", async () => {
      authenticatedGet.mockImplementation((_path, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
      }));

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

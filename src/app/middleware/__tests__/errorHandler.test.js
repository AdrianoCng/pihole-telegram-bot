import { describe, it, expect, beforeEach, vi } from "vitest";
import { UNEXPECTED_ERROR_MESSAGE } from "../../../shared/errors/AppError.js";
import { CommandError, CommandTimeoutError } from "../../../shared/errors/CommandError.js";
import {
  ApiAuthError,
  ApiError,
  ApiRejectedError,
  ApiResponseError,
  ApiUnreachableError,
} from "../../../shared/errors/ApiError.js";
import { sendMessage } from "../../../shared/telegram/sendMessage.js";
import { logError } from "../../../shared/logError.js";
import { debugDetails, handleBotError, userMessage } from "../errorHandler.js";

vi.mock("../../../shared/telegram/sendMessage.js", () => ({ sendMessage: vi.fn() }));
vi.mock("../../../shared/logError.js", () => ({ logError: vi.fn() }));

const env = vi.hoisted(() => ({ DEBUG: false }));
vi.mock("../../../config.js", () => ({ env }));

const REQUEST_FAILED = "❌ Pi-hole request failed.";

const serverError = () =>
  new ApiError({ message: "Static failure", method: "GET", status: 500, path: "/test" });

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.DEBUG = false;
  });

  it.each([
    [
      new ApiAuthError({ status: 401 }),
      "❌ Pi-hole authentication failed. Check the configured credentials.",
    ],
    [new ApiUnreachableError(), "❌ Pi-hole is not responding. Try again shortly."],
    [new ApiResponseError(), "❌ Pi-hole returned an invalid response."],
    [new ApiRejectedError(), "❌ Pi-hole rejected the change."],
    [serverError(), REQUEST_FAILED],
    [new CommandError({ exitCode: 17 }), "❌ Command failed with exit code 17"],
    [new CommandError(), "❌ Command failed."],
    [new CommandTimeoutError(), "❌ Command timed out."],
    [new TypeError("Cannot read properties of undefined"), UNEXPECTED_ERROR_MESSAGE],
    [new Error("unexpected"), UNEXPECTED_ERROR_MESSAGE],
    [undefined, UNEXPECTED_ERROR_MESSAGE],
  ])("maps %o to its fixed user-facing message", (error, expected) => {
    expect(userMessage(error)).toBe(expected);
  });

  it("logs under the command and awaits the user reply", async () => {
    const error = serverError();
    const ctx = { command: "summary" };
    let resolveReply;
    sendMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveReply = resolve;
      })
    );

    let settled = false;
    const handling = handleBotError(error, ctx).then(() => {
      settled = true;
    });
    await Promise.resolve();

    expect(logError).toHaveBeenCalledWith({ operation: "summary", error });
    expect(sendMessage).toHaveBeenCalledWith(ctx, REQUEST_FAILED);
    expect(settled).toBe(false);

    resolveReply();
    await handling;
    expect(settled).toBe(true);
  });

  it("uses update when the context has no command", async () => {
    const error = new Error("unexpected");
    sendMessage.mockResolvedValue();

    await handleBotError(error, {});

    expect(logError).toHaveBeenCalledWith({ operation: "update", error });
  });

  it("logs a failed Telegram reply and never rethrows", async () => {
    const error = new Error("original");
    const replyError = new Error("Telegram unavailable");
    sendMessage.mockRejectedValue(replyError);

    await expect(handleBotError(error, {})).resolves.toBeUndefined();

    expect(logError).toHaveBeenNthCalledWith(2, {
      operation: "error-reply",
      path: "telegram",
      error: replyError,
    });
  });

  it("appends error details to the reply when DEBUG is true", async () => {
    env.DEBUG = true;
    sendMessage.mockResolvedValue();

    await handleBotError(serverError(), {});

    const reply = sendMessage.mock.calls[0][1];
    expect(reply).toBe(
      `${REQUEST_FAILED}\n\n[i] Debug: ApiError: Static failure\ncode: API\nafterRetry: undefined\nmethod: GET\npath: /test\nstatus: 500` +
        "\napiErrorKey: undefined\napiErrorHint: undefined"
    );
  });

  it("sends only the fixed message when DEBUG is false", async () => {
    sendMessage.mockResolvedValue();

    await handleBotError(new Error("secret detail"), {});

    expect(sendMessage).toHaveBeenCalledWith({}, UNEXPECTED_ERROR_MESSAGE);
  });
});

describe("debugDetails", () => {
  it("lists Pi-hole's error key and hint and the retry", () => {
    const error = new ApiError({
      message: "Bad Request",
      method: "POST",
      path: "/domains/allow/exact",
      status: 400,
      apiError: { key: "database_error", hint: "UNIQUE constraint failed" },
    });
    error.afterRetry = true;

    expect(debugDetails(error)).toBe(
      "\n\n[i] Debug: ApiError: Bad Request\ncode: API\nafterRetry: true\nmethod: POST" +
        "\npath: /domains/allow/exact\nstatus: 400\napiErrorKey: database_error" +
        "\napiErrorHint: UNIQUE constraint failed"
    );
  });

  it("shows the cause chain with system error codes", () => {
    const refused = Object.assign(new Error("connect ECONNREFUSED 10.0.0.2:80"), {
      code: "ECONNREFUSED",
    });
    const error = new ApiUnreachableError({
      method: "GET",
      path: "/stats/summary",
      cause: new TypeError("fetch failed", { cause: refused }),
    });

    expect(debugDetails(error)).toBe(
      "\n\n[i] Debug: ApiUnreachableError: Pi-hole did not respond\ncode: API_UNREACHABLE" +
        "\nafterRetry: undefined\nmethod: GET\npath: /stats/summary\nstatus: undefined" +
        "\napiErrorKey: undefined\napiErrorHint: undefined\ncaused by: TypeError: fetch failed" +
        "\ncaused by: Error: connect ECONNREFUSED 10.0.0.2:80 (ECONNREFUSED)"
    );
  });

  it("stops the cause chain after three levels", () => {
    const deep = ["a", "b", "c", "d"].reduceRight(
      (cause, message) => new Error(message, { cause }),
      undefined
    );
    const details = debugDetails(new ApiResponseError({ cause: deep }));

    expect(details.match(/caused by:/g)).toHaveLength(3);
    expect(details).not.toContain("Error: d");
  });

  it("shows command details", () => {
    const error = new CommandTimeoutError({ command: "pihole -up", signal: "SIGTERM" });

    expect(debugDetails(error)).toBe(
      "\n\n[i] Debug: CommandTimeoutError: Command timed out\ncode: COMMAND_TIMEOUT" +
        "\nafterRetry: undefined\ncommand: pihole -up\nexitCode: undefined\nsignal: SIGTERM"
    );
  });

  it("shows where an unexpected error was thrown", () => {
    const details = debugDetails(new Error("secret detail"));

    expect(details).toMatch(
      /^\n\n\[i\] Debug: Error: secret detail\nat: .*errorHandler\.test\.js:\d+:\d+/
    );
  });

  it("tolerates a missing error", () => {
    expect(debugDetails(undefined)).toBe("\n\n[i] Debug: Error");
  });
});

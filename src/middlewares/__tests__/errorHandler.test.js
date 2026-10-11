import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DEFAULT_ERROR_MESSAGES } from "../../constants/errorMessages.js";
import CommandError from "../../errors/CommandError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import sendMessage from "../../helpers/sendMessage.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import handleBotError, { userMessage } from "../errorHandler.js";

vi.mock("../../helpers/sendMessage.js", () => ({ default: vi.fn() }));
vi.mock("../../helpers/logSafeError.js", () => ({ logSafeError: vi.fn() }));

const piholeError = (code, status) =>
  new PiholeError({ code, message: "Static failure", status, path: "/test" });

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  afterEach(() => {
    delete process.env.DEBUG;
  });

  it.each([
    [piholeError(PIHOLE_ERROR_CODES.HTTP, 401), DEFAULT_ERROR_MESSAGES.AUTHENTICATION],
    [piholeError(PIHOLE_ERROR_CODES.INVALID_SESSION), DEFAULT_ERROR_MESSAGES.AUTHENTICATION],
    [piholeError(PIHOLE_ERROR_CODES.INVALID_RESPONSE), DEFAULT_ERROR_MESSAGES.INVALID_RESPONSE],
    [new TypeError("fetch failed"), DEFAULT_ERROR_MESSAGES.NOT_RESPONDING],
    [piholeError(PIHOLE_ERROR_CODES.HTTP, 500), DEFAULT_ERROR_MESSAGES.REQUEST_FAILED],
    [new Error("unexpected"), DEFAULT_ERROR_MESSAGES.UNEXPECTED],
    [undefined, DEFAULT_ERROR_MESSAGES.UNEXPECTED],
  ])("maps an error to its fixed user-facing message", (error, expected) => {
    expect(userMessage(error)).toBe(expected);
  });

  it("includes the exit code in command failure messages", () => {
    expect(userMessage(new CommandError(17))).toBe("❌ Command failed with exit code 17");
  });

  it("logs under the command and awaits the user reply", async () => {
    const error = piholeError(PIHOLE_ERROR_CODES.HTTP, 500);
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

    expect(logSafeError).toHaveBeenCalledWith({ operation: "summary", error });
    expect(sendMessage).toHaveBeenCalledWith(ctx, DEFAULT_ERROR_MESSAGES.REQUEST_FAILED);
    expect(settled).toBe(false);

    resolveReply();
    await handling;
    expect(settled).toBe(true);
  });

  it("uses update when the context has no command", async () => {
    const error = new Error("unexpected");
    sendMessage.mockResolvedValue();

    await handleBotError(error, {});

    expect(logSafeError).toHaveBeenCalledWith({ operation: "update", error });
  });

  it("logs a failed Telegram reply and never rethrows", async () => {
    const error = new Error("original");
    const replyError = new Error("Telegram unavailable");
    sendMessage.mockRejectedValue(replyError);

    await expect(handleBotError(error, {})).resolves.toBeUndefined();

    expect(logSafeError).toHaveBeenNthCalledWith(2, {
      operation: "error-reply",
      path: "telegram",
      error: replyError,
    });
  });

  it("appends error details to the reply when DEBUG is true", async () => {
    process.env.DEBUG = "true";
    sendMessage.mockResolvedValue();

    await handleBotError(piholeError(PIHOLE_ERROR_CODES.HTTP, 500), {});

    const reply = sendMessage.mock.calls[0][1];
    expect(reply.startsWith(DEFAULT_ERROR_MESSAGES.REQUEST_FAILED)).toBe(true);
    expect(reply).toContain("Static failure");
    expect(reply).toContain("status: 500");
    expect(reply).toContain("path: /test");
  });

  it("sends the original error message to the chat when DEBUG is true", async () => {
    process.env.DEBUG = "true";
    sendMessage.mockResolvedValue();
    const ctx = {};

    await handleBotError(new Error("secret detail"), ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      ctx,
      `${DEFAULT_ERROR_MESSAGES.UNEXPECTED}\n\n[i] Debug: Error: secret detail`
    );
  });

  it("sends only the fixed message when DEBUG is false", async () => {
    process.env.DEBUG = "false";
    sendMessage.mockResolvedValue();

    await handleBotError(new Error("secret detail"), {});

    expect(sendMessage).toHaveBeenCalledWith({}, DEFAULT_ERROR_MESSAGES.UNEXPECTED);
  });
});

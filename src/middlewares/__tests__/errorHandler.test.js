import { DEFAULT_ERROR_MESSAGES } from "../../constants/errorMessages.js";
import CommandError from "../../errors/CommandError.js";
import PiholeError, { PIHOLE_ERROR_CODES } from "../../errors/PiholeError.js";
import { sendMessage } from "../../helpers/index.js";
import { logSafeError } from "../../helpers/logSafeError.js";
import handleBotError, { userMessage } from "../errorHandler.js";

jest.mock("../../helpers/index.js", () => ({ sendMessage: jest.fn() }));
jest.mock("../../helpers/logSafeError.js", () => ({ logSafeError: jest.fn() }));

const piholeError = (code, status) =>
  new PiholeError({ code, message: "Static failure", status, path: "/test" });

describe("errorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    sendMessage.mockReturnValue(new Promise((resolve) => { resolveReply = resolve; }));

    let settled = false;
    const handling = handleBotError(error, ctx).then(() => { settled = true; });
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
});

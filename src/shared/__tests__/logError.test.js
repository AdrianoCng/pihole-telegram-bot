import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logError } from "../logError.js";

const env = vi.hoisted(() => ({ BOT_TOKEN: "123:test-token" }));
vi.mock("../../config.js", () => ({ env }));

describe("logError", () => {
  let log;

  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  it("logs the operation, path and full error", () => {
    const error = new Error("boom", { cause: new Error("root") });

    logError({ operation: "summary", path: "/stats/summary", error });

    expect(log).toHaveBeenCalledTimes(1);
    const [label, output] = log.mock.calls[0];
    expect(label).toBe("[summary /stats/summary]");
    expect(output).toContain("boom");
    expect(output).toContain("root");
  });

  it("omits the path when there is none", () => {
    logError({ operation: "update", error: new Error("x") });

    expect(log.mock.calls[0][0]).toBe("[update]");
  });

  it("masks the bot token anywhere in the error", () => {
    const error = new Error(
      "request to https://api.telegram.org/bot123:test-token/sendMessage failed",
      {
        cause: new Error("bot123:test-token"),
      }
    );

    logError({ operation: "error-reply", path: "telegram", error });

    expect(log.mock.calls[0].join(" ")).not.toContain("123:test-token");
    expect(log.mock.calls[0][1]).toContain("<redacted>");
  });

  it("tolerates non-Error values", () => {
    logError({ operation: "update", error: "plain failure" });

    expect(log.mock.calls[0][1]).toContain("plain failure");
  });
});

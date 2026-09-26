import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import authenticate from "../authenticate";
import { sendMessage } from "../../helpers/index.js";

vi.mock("../../helpers/index.js");

describe("Authenticate Middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("Should block unauthorized access", async () => {
    process.env.ALLOWED_USER = "456";
    const ctx = {
      from: {
        id: "123",
      },
    };
    const next = vi.fn();

    await authenticate(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      ctx, "⛔️ Unauthorized access! You are not allowed to use this bot."
    );
  });

  it("awaits and propagates an unauthorized reply failure", async () => {
    process.env.ALLOWED_USER = "456";
    const error = new Error("Telegram unavailable");
    sendMessage.mockRejectedValue(error);

    await expect(authenticate({ from: { id: "123" } }, vi.fn())).rejects.toBe(error);
  });

    it("Should allow authorized access", async () => {
      process.env.ALLOWED_USER = "123";
      const ctx = {
        from: {
          id: "123",
        },
      };
      const next = vi.fn();

      await authenticate(ctx, next);

      expect(next).toHaveBeenCalled();
    });
});

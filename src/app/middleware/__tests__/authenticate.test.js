import { describe, it, expect, beforeEach, vi } from "vitest";
import { authenticate } from "../authenticate.js";
import { sendMessage } from "../../../shared/telegram/sendMessage.js";

vi.mock("../../../shared/telegram/sendMessage.js");

const env = vi.hoisted(() => ({ ALLOWED_USER: "" }));
vi.mock("../../../config.js", () => ({ env }));

describe("Authenticate Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should block unauthorized access", async () => {
    env.ALLOWED_USER = "456";
    const ctx = {
      from: {
        id: "123",
      },
    };
    const next = vi.fn();

    await authenticate(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      ctx,
      "⛔️ Unauthorized access! You are not allowed to use this bot."
    );
  });

  it("awaits and propagates an unauthorized reply failure", async () => {
    env.ALLOWED_USER = "456";
    const error = new Error("Telegram unavailable");
    sendMessage.mockRejectedValue(error);

    await expect(authenticate({ from: { id: "123" } }, vi.fn())).rejects.toBe(error);
  });

  it("Should allow authorized access", async () => {
    env.ALLOWED_USER = "123";
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

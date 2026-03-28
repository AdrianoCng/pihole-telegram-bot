import createAuthMiddleware from "../authenticate.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("Authenticate Middleware", () => {
  let mockSender;

  beforeEach(() => {
    mockSender = { send: jest.fn() };
  });

  it("should block unauthorized access", async () => {
    const middleware = createAuthMiddleware({
      config: { get: () => "456" },
      messageSender: mockSender,
    });
    const ctx = createMockContext({ from: { id: 123 } });
    const next = jest.fn();

    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockSender.send).toHaveBeenCalledWith(
      ctx,
      "⛔️ Unauthorized access! You are not allowed to use this bot."
    );
  });

  it("should allow authorized access", async () => {
    const middleware = createAuthMiddleware({
      config: { get: () => "123" },
      messageSender: mockSender,
    });
    const ctx = createMockContext({ from: { id: 123 } });
    const next = jest.fn();

    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(mockSender.send).not.toHaveBeenCalled();
  });
});

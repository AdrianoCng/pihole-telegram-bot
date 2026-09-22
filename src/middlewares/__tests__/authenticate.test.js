import authenticate from "../authenticate";
import { sendMessage } from "../../helpers/index.js";

jest.mock("../../helpers/index.js");

describe("Authenticate Middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("Should block unauthorized access", async () => {
    process.env.ALLOWED_USER = "456";
    const ctx = {
      from: {
        id: "123",
      },
    };
    const next = jest.fn();

    await authenticate(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      ctx, "⛔️ Unauthorized access! You are not allowed to use this bot."
    );
  });

    it("Should allow authorized access", async () => {
      process.env.ALLOWED_USER = "123";
      const ctx = {
        from: {
          id: "123",
        },
      };
      const next = jest.fn();

      await authenticate(ctx, next);

      expect(next).toHaveBeenCalled();
    });
});

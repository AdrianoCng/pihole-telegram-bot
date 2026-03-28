import PiholeCommandExecutor from "../PiholeCommandExecutor.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("PiholeCommandExecutor", () => {
  let executor;
  let mockCommandExecutor;
  let ctx;

  beforeEach(() => {
    mockCommandExecutor = { exec: jest.fn().mockResolvedValue(undefined) };
    executor = new PiholeCommandExecutor({ commandExecutor: mockCommandExecutor });
    ctx = createMockContext();
  });

  it("delegates to commandExecutor with 'pihole' as the command", async () => {
    await executor.exec(ctx, ["status"]);

    expect(mockCommandExecutor.exec).toHaveBeenCalledWith(ctx, "pihole", [
      "status",
    ]);
  });

  it("passes all arguments through", async () => {
    await executor.exec(ctx, ["-up", "--verbose"]);

    expect(mockCommandExecutor.exec).toHaveBeenCalledWith(ctx, "pihole", [
      "-up",
      "--verbose",
    ]);
  });
});

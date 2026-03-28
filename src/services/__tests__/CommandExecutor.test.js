import CommandExecutor from "../CommandExecutor.js";
import { createMockContext, createMockProcess } from "../../__tests__/helpers/testUtils.js";

describe("CommandExecutor", () => {
  let executor;
  let mockSender;
  let mockSpawn;
  let ctx;

  beforeEach(() => {
    mockSender = { send: jest.fn() };
    mockSpawn = jest.fn();
    executor = new CommandExecutor({ messageSender: mockSender, spawn: mockSpawn });
    ctx = createMockContext();
  });

  it("spawns a command with sudo and sends stdout to messageSender", async () => {
    mockSpawn.mockReturnValue(createMockProcess({ stdoutData: "output" }));

    await executor.exec(ctx, "pihole", ["status"]);

    expect(mockSpawn).toHaveBeenCalledWith("sudo", ["pihole", "status"]);
    expect(mockSender.send).toHaveBeenCalledWith(ctx, "output");
  });

  it("sends stderr to messageSender", async () => {
    mockSpawn.mockReturnValue(createMockProcess({ stderrData: "error output" }));

    await executor.exec(ctx, "pihole", ["status"]);

    expect(mockSender.send).toHaveBeenCalledWith(ctx, "error output");
  });

  it("resolves on exit code 0", async () => {
    mockSpawn.mockReturnValue(createMockProcess({ exitCode: 0 }));

    await expect(executor.exec(ctx, "ls")).resolves.toBeUndefined();
  });

  it("rejects and sends error message on non-zero exit code", async () => {
    mockSpawn.mockReturnValue(createMockProcess({ exitCode: 1 }));

    await expect(executor.exec(ctx, "fail")).rejects.toThrow(
      "Command failed with exit code 1"
    );
    expect(mockSender.send).toHaveBeenCalledWith(
      ctx,
      "Command failed with exit code 1"
    );
  });

  it("defaults args to empty array", async () => {
    mockSpawn.mockReturnValue(createMockProcess());

    await executor.exec(ctx, "pihole");

    expect(mockSpawn).toHaveBeenCalledWith("sudo", ["pihole"]);
  });
});

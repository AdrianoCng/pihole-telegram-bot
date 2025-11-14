import { spawn } from "child_process";
import execCommandWithOutput from "../execCommandWithOutput";
import { sendMessage } from "../index";
import {
  createMockContext,
  createMockProcess,
} from "../../__tests__/helpers/testUtils";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));
jest.mock("../index");

describe("execCommandWithOutput", () => {
  const mockCtx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute a command and send stdout to the chat", async () => {
    const command = "ls";
    const args = ["-la"];
    const output = "some output";

    const mockProcess = createMockProcess({ stdoutData: output });
    spawn.mockReturnValue(mockProcess);

    await execCommandWithOutput(mockCtx, command, args);

    expect(spawn).toHaveBeenCalledWith("sudo", [command, ...args]);
    expect(sendMessage).toHaveBeenCalledWith(mockCtx, output);
  });

  it("should reject and send stderr to the chat on error", async () => {
    const command = "error-command";
    const args = [];
    const errorOutput = "some error";

    const mockProcess = createMockProcess({
      stderrData: errorOutput,
      exitCode: 1,
    });
    spawn.mockReturnValue(mockProcess);

    await expect(execCommandWithOutput(mockCtx, command, args)).rejects.toThrow(
      "Command failed with exit code 1"
    );

    expect(spawn).toHaveBeenCalledWith("sudo", [command, ...args]);
    expect(sendMessage).toHaveBeenCalledWith(mockCtx, errorOutput);
  });

  it("should resolve on process close", async () => {
    const command = "ls";
    const args = [];

    const mockProcess = createMockProcess({ exitCode: 0 });
    spawn.mockReturnValue(mockProcess);

    await expect(
      execCommandWithOutput(mockCtx, command, args)
    ).resolves.toBeUndefined();
  });

  it("should execute a command with no arguments and send stdout to the chat", async () => {
    const command = "ls";
    const output = "some output";

    const mockProcess = createMockProcess({ stdoutData: output });
    spawn.mockReturnValue(mockProcess);

    await execCommandWithOutput(mockCtx, command);

    expect(spawn).toHaveBeenCalledWith("sudo", [command]);
    expect(sendMessage).toHaveBeenCalledWith(mockCtx, output);
  });
});

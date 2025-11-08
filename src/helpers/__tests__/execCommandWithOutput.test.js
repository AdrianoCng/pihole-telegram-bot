import { spawn } from "child_process";
import execCommandWithOutput from "../execCommandWithOutput";
import { sendMessage } from "../index";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("../index", () => ({
  sendMessage: jest.fn(),
}));

describe("execCommandWithOutput", () => {
  let mockCtx;
  let spawnOnMock;
  let spawnStdoutOnMock;
  let spawnStderrOnMock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCtx = { chat: { id: 123 } };

    spawnOnMock = jest.fn();
    spawnStdoutOnMock = jest.fn();
    spawnStderrOnMock = jest.fn();

    spawn.mockReturnValue({
      on: spawnOnMock,
      stdout: {
        on: spawnStdoutOnMock,
      },
      stderr: {
        on: spawnStderrOnMock,
      },
    });
  });

  it("should execute a command and send stdout to the chat", async () => {
    const command = "ls";
    const args = ["-la"];
    const output = "some output";

    spawnStdoutOnMock.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(Buffer.from(output));
      }
    });

    spawnOnMock.mockImplementation((event, callback) => {
      if (event === "close") {
        callback();
      }
    });

    await execCommandWithOutput(mockCtx, command, args);

    expect(spawn).toHaveBeenCalledWith("sudo", [command, ...args]);
    expect(sendMessage).toHaveBeenCalledWith(mockCtx, output);
  });

  it("should reject and send stderr to the chat on error", async () => {
    const command = "error-command";
    const args = [];
    const errorOutput = "some error";

    spawnStderrOnMock.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(Buffer.from(errorOutput));
      }
    });

    await expect(execCommandWithOutput(mockCtx, command, args)).rejects.toBe(
      errorOutput
    );

    expect(spawn).toHaveBeenCalledWith("sudo", [command, ...args]);
    expect(sendMessage).toHaveBeenCalledWith(mockCtx, errorOutput);
  });

  it("should resolve on process close", async () => {
    const command = "ls";
    const args = [];

    spawnOnMock.mockImplementation((event, callback) => {
      if (event === "close") {
        callback();
      }
    });

    await expect(
      execCommandWithOutput(mockCtx, command, args)
    ).resolves.toBeUndefined();
  });
});

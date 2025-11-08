import { spawn } from "child_process";
import { sendMessage, spawnPiholeCommand } from "..";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("../sendMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("spawnPiholeCommand", () => {
  const mockCtx = {
    reply: jest.fn(),
  };
  const args = ["--help"];
  let mockProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === "close") {
          callback(0);
        }
      }),
    };
    spawn.mockReturnValue(mockProcess);
  });

  describe("Successful command execution", () => {
    it("should spawn a Pi-hole process with correct arguments", () => {
      spawnPiholeCommand(mockCtx, args);

      expect(spawn).toHaveBeenCalledWith("sudo", ["pihole", ...args]);
    });

    it("should send stdout data to chat", async () => {
      const stdoutData = "Pi-hole help message";

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(Buffer.from(stdoutData));
        }
      });

      await spawnPiholeCommand(mockCtx, args);

      expect(sendMessage).toHaveBeenCalledWith(mockCtx, stdoutData);
    });

    it("Should resolves when process closes successfully", async () => {
      const promise = spawnPiholeCommand(mockCtx, args);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("Should handle stderr data and reject with error", async () => {
      const stderrData = "Something wrong";

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(Buffer.from(stderrData));
        }
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === "close") {
          callback(1);
        }
      });

      const promise = spawnPiholeCommand(mockCtx, args);

      await expect(promise).rejects.toThrow("Command failed with exit code 1");
      expect(sendMessage).toHaveBeenCalledWith(mockCtx, stderrData);
    });
  });
});

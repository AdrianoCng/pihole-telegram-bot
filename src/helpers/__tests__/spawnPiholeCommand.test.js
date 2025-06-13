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
          setTimeout(callback, 10);
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
          setTimeout(() => callback(Buffer.from(stdoutData)), 0);
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
          setTimeout(() => callback(Buffer.from(stderrData)), 0);
        }
      });

      const promise = spawnPiholeCommand(mockCtx, args);

      await expect(promise).rejects.toBe(stderrData);
    });
  });

  //   it("should send stderr data to chat and reject on error", async () => {
  //     const args = ["--help"];
  //     const stderrData = "Error message";

  //     try {
  //       const promise = spawnPiholeCommand(mockCtx, args);

  //       const stderrCallback = mockProcess.stderr.on.mock.calls[0][1];
  //       stderrCallback(Buffer.from(stderrData));

  //       expect(promise).rejects.toBeDefined();
  //       expect(sendMessage).toHaveBeenCalledWith(mockCtx, stderrData);
  //     } catch (error) {}
  //   });

  //   it("should resolve when process closes successfully", async () => {
  //     const args = ["--help"];

  //     const promise = spawnPiholeCommand(mockCtx, args);

  //     const closeCallback = mockProcess.on.mock.calls[0][1];
  //     closeCallback();

  //     await expect(promise).resolves.toBeUndefined();
  //   });
});

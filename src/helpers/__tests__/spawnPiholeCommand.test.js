import { spawn } from "child_process";
import { sendMessage, spawnPiholeCommand } from "..";
import {
  createMockContext,
  createMockProcess,
} from "../../__tests__/helpers/testUtils";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("../sendMessage");

describe("spawnPiholeCommand", () => {
  const mockCtx = createMockContext();
  const args = ["--help"];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful command execution", () => {
    it("should spawn a Pi-hole process with correct arguments", () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      spawnPiholeCommand(mockCtx, args);

      expect(spawn).toHaveBeenCalledWith("sudo", ["pihole", ...args]);
    });

    it("should send stdout data to chat", () => {
      const stdoutData = "Pi-hole help message";
      const mockProcess = createMockProcess({ stdoutData, exitCode: 0 });
      spawn.mockReturnValue(mockProcess);

      spawnPiholeCommand(mockCtx, args);

      expect(sendMessage).toHaveBeenCalledWith(mockCtx, stdoutData);
    });

    it("Should resolves when process closes successfully", async () => {
      const mockProcess = createMockProcess({ exitCode: 0 });
      spawn.mockReturnValue(mockProcess);

      const promise = spawnPiholeCommand(mockCtx, args);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("Should handle stderr data and reject with error", async () => {
      const stderrData = "Something wrong";
      const mockProcess = createMockProcess({ stderrData, exitCode: 1 });
      spawn.mockReturnValue(mockProcess);

      const promise = spawnPiholeCommand(mockCtx, args);

      await expect(promise).rejects.toThrow("Command failed with exit code 1");
      expect(sendMessage).toHaveBeenCalledWith(mockCtx, stderrData);
    });
  });
});

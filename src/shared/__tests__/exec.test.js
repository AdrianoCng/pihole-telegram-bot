import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawn } from "child_process";
import { execCommandWithOutput } from "../exec.js";
import { createMockProcess } from "../../__tests__/helpers/testUtils.js";
import { COMMAND_TIMEOUT_MS } from "../timers.js";

vi.mock("child_process", () => ({ spawn: vi.fn() }));

describe("execCommandWithOutput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs a sudo command and reports stdout", async () => {
    const onOutput = vi.fn();
    const process = createMockProcess({ stdoutData: "some output" });
    spawn.mockReturnValue(process);

    await execCommandWithOutput("ls", ["-la"], onOutput);

    expect(spawn).toHaveBeenCalledWith("sudo", ["-n", "ls", "-la"], {
      signal: expect.any(AbortSignal),
    });
    expect(onOutput).toHaveBeenCalledWith("some output");
    expect(process.once.mock.calls.map(([event]) => event)).toEqual(["close", "error"]);
  });

  it("reports stderr and rejects on a nonzero exit", async () => {
    const onOutput = vi.fn();
    spawn.mockReturnValue(createMockProcess({ stderrData: "permission denied", exitCode: 1 }));

    await expect(execCommandWithOutput("restricted", [], onOutput)).rejects.toMatchObject({
      name: "CommandError",
      code: "COMMAND_FAILED",
      command: "restricted",
      exitCode: 1,
      message: "Command failed",
    });

    expect(onOutput).toHaveBeenCalledWith("permission denied");
    expect(onOutput).toHaveBeenCalledTimes(1);
  });

  it("supports omitted arguments and output callbacks", async () => {
    spawn.mockReturnValue(createMockProcess({ stdoutData: "rebooting" }));

    await expect(execCommandWithOutput("reboot")).resolves.toBeUndefined();

    expect(spawn).toHaveBeenCalledWith("sudo", ["-n", "reboot"], {
      signal: expect.any(AbortSignal),
    });
  });

  it("uses the command timeout for the child-process abort signal", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    spawn.mockReturnValue(createMockProcess());

    await execCommandWithOutput("status");

    expect(timeout).toHaveBeenCalledWith(COMMAND_TIMEOUT_MS);
    timeout.mockRestore();
  });

  it("maps child-process spawn errors to command failures", async () => {
    const error = new Error("spawn failed");
    spawn.mockReturnValue(createMockProcess({ spawnError: error }));

    const failure = execCommandWithOutput("status");

    await expect(failure).rejects.toMatchObject({
      name: "CommandError",
      code: "COMMAND_FAILED",
      message: "Command failed",
      command: "status",
      cause: error,
    });
    await expect(failure).rejects.toHaveProperty("userMessage", "❌ Command failed.");
  });

  it("reports a process killed by a signal without an exit code", async () => {
    spawn.mockReturnValue(createMockProcess({ exitCode: null, exitSignal: "SIGKILL" }));

    await expect(execCommandWithOutput("pihole", ["-up"])).rejects.toMatchObject({
      name: "CommandError",
      command: "pihole -up",
      exitCode: undefined,
      signal: "SIGKILL",
    });
  });

  describe("after the command timeout", () => {
    let timeout;

    beforeEach(() => {
      timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(AbortSignal.abort(new DOMException("timed out", "TimeoutError")));
    });

    afterEach(() => {
      timeout.mockRestore();
    });

    it("reports the abort error as a timeout", async () => {
      const error = new DOMException("The operation was aborted", "AbortError");
      spawn.mockReturnValue(createMockProcess({ spawnError: error }));

      await expect(execCommandWithOutput("apt-get", ["update"])).rejects.toMatchObject({
        name: "CommandTimeoutError",
        code: "COMMAND_TIMEOUT",
        command: "apt-get update",
        cause: error,
      });
    });

    it("reports the killed process as a timeout", async () => {
      spawn.mockReturnValue(createMockProcess({ exitCode: null, exitSignal: "SIGTERM" }));

      await expect(execCommandWithOutput("apt-get", ["update"])).rejects.toMatchObject({
        name: "CommandTimeoutError",
        signal: "SIGTERM",
      });
    });
  });
});

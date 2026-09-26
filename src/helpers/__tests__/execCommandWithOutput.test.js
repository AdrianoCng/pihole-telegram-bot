import { spawn } from "child_process";
import execCommandWithOutput from "../execCommandWithOutput.js";
import { createMockProcess } from "../../__tests__/helpers/testUtils.js";
import { COMMAND_TIMEOUT_MS } from "../../constants/timers.js";

jest.mock("child_process", () => ({ spawn: jest.fn() }));

describe("execCommandWithOutput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs a sudo command and reports stdout", async () => {
    const onOutput = jest.fn();
    const process = createMockProcess({ stdoutData: "some output" });
    spawn.mockReturnValue(process);

    await execCommandWithOutput("ls", ["-la"], onOutput);

    expect(spawn).toHaveBeenCalledWith(
      "sudo",
      ["-n", "ls", "-la"],
      { signal: expect.any(AbortSignal) }
    );
    expect(onOutput).toHaveBeenCalledWith("some output");
    expect(process.once.mock.calls.map(([event]) => event)).toEqual(["close", "error"]);
  });

  it("reports stderr and rejects on a nonzero exit", async () => {
    const onOutput = jest.fn();
    spawn.mockReturnValue(
      createMockProcess({ stderrData: "permission denied", exitCode: 1 })
    );

    await expect(execCommandWithOutput("restricted", [], onOutput)).rejects.toMatchObject({
      name: "CommandError",
      code: "COMMAND_FAILED",
      exitCode: 1,
      message: "Command failed",
    });

    expect(onOutput).toHaveBeenCalledWith("permission denied");
    expect(onOutput).toHaveBeenCalledWith("Command failed with exit code 1");
  });

  it("supports omitted arguments and output callbacks", async () => {
    spawn.mockReturnValue(createMockProcess({ stdoutData: "rebooting" }));

    await expect(execCommandWithOutput("reboot")).resolves.toBeUndefined();

    expect(spawn).toHaveBeenCalledWith(
      "sudo",
      ["-n", "reboot"],
      { signal: expect.any(AbortSignal) }
    );
  });

  it("uses the command timeout for the child-process abort signal", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout");
    spawn.mockReturnValue(createMockProcess());

    await execCommandWithOutput("status");

    expect(timeout).toHaveBeenCalledWith(COMMAND_TIMEOUT_MS);
    timeout.mockRestore();
  });

  it("propagates child-process spawn errors", async () => {
    const error = new Error("spawn failed");
    spawn.mockReturnValue(createMockProcess({ spawnError: error }));

    await expect(execCommandWithOutput("status")).rejects.toBe(error);
  });
});

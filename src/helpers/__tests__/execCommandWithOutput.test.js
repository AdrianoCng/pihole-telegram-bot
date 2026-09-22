import { spawn } from "child_process";
import execCommandWithOutput from "../execCommandWithOutput.js";
import { createMockProcess } from "../../__tests__/helpers/testUtils.js";

jest.mock("child_process", () => ({ spawn: jest.fn() }));

describe("execCommandWithOutput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs a sudo command and reports stdout", async () => {
    const onOutput = jest.fn();
    spawn.mockReturnValue(createMockProcess({ stdoutData: "some output" }));

    await execCommandWithOutput("ls", ["-la"], onOutput);

    expect(spawn).toHaveBeenCalledWith("sudo", ["ls", "-la"]);
    expect(onOutput).toHaveBeenCalledWith("some output");
  });

  it("reports stderr and rejects on a nonzero exit", async () => {
    const onOutput = jest.fn();
    spawn.mockReturnValue(
      createMockProcess({ stderrData: "permission denied", exitCode: 1 })
    );

    await expect(
      execCommandWithOutput("restricted", [], onOutput)
    ).rejects.toThrow("Command failed with exit code 1");

    expect(onOutput).toHaveBeenCalledWith("permission denied");
    expect(onOutput).toHaveBeenCalledWith("Command failed with exit code 1");
  });

  it("supports omitted arguments and output callbacks", async () => {
    spawn.mockReturnValue(createMockProcess({ stdoutData: "rebooting" }));

    await expect(execCommandWithOutput("reboot")).resolves.toBeUndefined();

    expect(spawn).toHaveBeenCalledWith("sudo", ["reboot"]);
  });
});

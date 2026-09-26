import { describe, it, expect, beforeEach, vi } from "vitest";
import execCommandWithOutput from "../../helpers/execCommandWithOutput.js";
import systemService from "../systemService.js";

vi.mock("../../helpers/execCommandWithOutput.js");

describe("systemService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reboots through the command executor", async () => {
    const onOutput = vi.fn();

    await systemService.reboot(onOutput);

    expect(execCommandWithOutput).toHaveBeenCalledWith("reboot", [], onOutput);
  });

  it("runs the host upgrade steps sequentially", async () => {
    const onOutput = vi.fn();

    await systemService.upgradeHost(onOutput);

    expect(execCommandWithOutput.mock.calls).toEqual([
      ["apt-get", ["update"], onOutput],
      ["apt-get", ["full-upgrade", "-y"], onOutput],
      ["apt-get", ["autoremove", "-y"], onOutput],
      ["apt-get", ["clean"], onOutput],
    ]);
  });

  it("stops the host upgrade after a failed step", async () => {
    execCommandWithOutput
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("upgrade failed"));

    await expect(systemService.upgradeHost(vi.fn())).rejects.toThrow(
      "upgrade failed"
    );
    expect(execCommandWithOutput).toHaveBeenCalledTimes(2);
  });
});

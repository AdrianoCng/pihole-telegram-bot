import { CLI_COMMANDS } from "../../constants/cli";
import { execCommandWithOutput, spawnPiholeCommand } from "../../helpers";
import cliController from "../cliController";
import { createMockContext } from "../../__tests__/helpers/testUtils";

jest.mock("../../helpers");

describe("CLI Controllers", () => {
  const mockCtx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("statusController", () => {
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.STATUS];

      cliController.statusController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("enableController", () => {
    it('Should run pihole command "enable"', () => {
      const args = [CLI_COMMANDS.ENABLE];

      cliController.enableController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("disableController", () => {
    it('Should run pihole command "disable"', () => {
      const args = [CLI_COMMANDS.DISABLE];

      cliController.disableController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("versionController", () => {
    it('Should run pihole command "version"', () => {
      const args = [CLI_COMMANDS.VERSION];

      cliController.versionController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("updatePiholeController", () => {
    it('Should run pihole command "update"', () => {
      const args = [CLI_COMMANDS.UPDATE];

      cliController.updatePiholeController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("upgravityController", () => {
    it('Should run pihole command "upgravity"', () => {
      const args = [CLI_COMMANDS.UPGRAVITY];

      cliController.upgravityController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("rebootController", () => {
    it("Should run reboot command", () => {
      cliController.rebootController(mockCtx);

      expect(execCommandWithOutput).toHaveBeenCalledWith(mockCtx, "reboot");
    });
  });

  describe("upgradeController", () => {
    it("waits for each step and stops on failure", async () => {
      let finishUpdate;
      execCommandWithOutput.mockImplementationOnce(() => new Promise((resolve) => { finishUpdate = resolve; }));
      execCommandWithOutput.mockRejectedValueOnce(new Error("upgrade failed"));
      const upgrade = cliController.upgradeController(mockCtx);
      expect(execCommandWithOutput).toHaveBeenCalledTimes(1);
      finishUpdate();
      await expect(upgrade).rejects.toThrow("upgrade failed");
      expect(execCommandWithOutput).toHaveBeenCalledTimes(2);
      expect(execCommandWithOutput).toHaveBeenNthCalledWith(2, mockCtx, "apt-get", ["full-upgrade", "-y"]);
    });

    it("Should run upgrade command", async () => {
      await cliController.upgradeController(mockCtx);

      expect(execCommandWithOutput.mock.calls).toEqual([
        [mockCtx, "apt-get", ["update"]],
        [mockCtx, "apt-get", ["full-upgrade", "-y"]],
        [mockCtx, "apt-get", ["autoremove", "-y"]],
        [mockCtx, "apt-get", ["clean"]],
      ]);

      expect(execCommandWithOutput).toHaveBeenCalledWith(mockCtx, "apt-get", [
        "update",
      ]);
      expect(execCommandWithOutput).toHaveBeenCalledWith(mockCtx, "apt-get", [
        "full-upgrade",
        "-y",
      ]);
      expect(execCommandWithOutput).toHaveBeenCalledWith(mockCtx, "apt-get", [
        "autoremove",
        "-y",
      ]);
      expect(execCommandWithOutput).toHaveBeenCalledWith(mockCtx, "apt-get", [
        "clean",
      ]);
    });
  });
});

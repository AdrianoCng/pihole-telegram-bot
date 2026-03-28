import createStatusCommand from "../status.js";
import createEnableCommand from "../enable.js";
import createDisableCommand from "../disable.js";
import createVersionCommand from "../version.js";
import createUpdateCommand from "../update.js";
import createUpgravityCommand from "../upgravity.js";
import createRebootCommand from "../reboot.js";
import createUpgradeCommand from "../upgrade.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

describe("CLI Commands", () => {
  let mockPiholeExecutor;
  let mockCommandExecutor;
  let ctx;

  beforeEach(() => {
    mockPiholeExecutor = { exec: jest.fn().mockResolvedValue(undefined) };
    mockCommandExecutor = { exec: jest.fn().mockResolvedValue(undefined) };
    ctx = createMockContext();
  });

  describe("status", () => {
    it("calls piholeExecutor with status arg", async () => {
      const command = createStatusCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["status"]);
    });
  });

  describe("enable", () => {
    it("calls piholeExecutor with enable arg", async () => {
      const command = createEnableCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["enable"]);
    });
  });

  describe("disable", () => {
    it("calls piholeExecutor with disable arg", async () => {
      const command = createDisableCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["disable"]);
    });
  });

  describe("version", () => {
    it("calls piholeExecutor with -v arg", async () => {
      const command = createVersionCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["-v"]);
    });
  });

  describe("update", () => {
    it("calls piholeExecutor with -up arg", async () => {
      const command = createUpdateCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["-up"]);
    });
  });

  describe("upgravity", () => {
    it("calls piholeExecutor with -g arg", async () => {
      const command = createUpgravityCommand({ piholeExecutor: mockPiholeExecutor });
      await command.handler(ctx);
      expect(mockPiholeExecutor.exec).toHaveBeenCalledWith(ctx, ["-g"]);
    });
  });

  describe("reboot", () => {
    it("calls commandExecutor with reboot", async () => {
      const command = createRebootCommand({ commandExecutor: mockCommandExecutor });
      await command.handler(ctx);
      expect(mockCommandExecutor.exec).toHaveBeenCalledWith(ctx, "reboot");
    });
  });

  describe("upgrade", () => {
    it("runs apt update, full-upgrade, autoremove, and clean in sequence", async () => {
      const command = createUpgradeCommand({ commandExecutor: mockCommandExecutor });
      await command.handler(ctx);

      expect(mockCommandExecutor.exec).toHaveBeenCalledTimes(4);
      expect(mockCommandExecutor.exec).toHaveBeenNthCalledWith(1, ctx, "apt-get", ["update"]);
      expect(mockCommandExecutor.exec).toHaveBeenNthCalledWith(2, ctx, "apt-get", ["full-upgrade", "-y"]);
      expect(mockCommandExecutor.exec).toHaveBeenNthCalledWith(3, ctx, "apt-get", ["autoremove", "-y"]);
      expect(mockCommandExecutor.exec).toHaveBeenNthCalledWith(4, ctx, "apt-get", ["clean"]);
    });
  });
});

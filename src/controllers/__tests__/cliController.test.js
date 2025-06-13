import { CLI_COMMANDS } from "../../constants/cli";
import { spawnPiholeCommand } from "../../helpers";
import cliController from "../cliController";

jest.mock("../../helpers");

describe("CLI Controllers", () => {
  const mockCtx = {
    reply: jest.fn(),
  };

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
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.ENABLE];

      cliController.enableController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("disableController", () => {
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.DISABLE];

      cliController.disableController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("versionController", () => {
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.VERSION];

      cliController.versionController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("updatePiholeController", () => {
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.UPDATE];

      cliController.updatePiholeController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });

  describe("upgravityController", () => {
    it('Should run pihole command "status"', () => {
      const args = [CLI_COMMANDS.UPGRAVITY];

      cliController.upgravityController(mockCtx, args);

      expect(spawnPiholeCommand).toHaveBeenCalledWith(mockCtx, args);
    });
  });
});

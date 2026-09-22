import cliController from "../cliController.js";
import piholeService from "../../services/piholeService.js";
import systemService from "../../services/systemService.js";
import { sendMessage } from "../../helpers/index.js";
import { createMockContext } from "../../__tests__/helpers/testUtils.js";

jest.mock("../../services/piholeService.js", () => ({
  __esModule: true,
  default: {
    getStatus: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    getVersion: jest.fn(),
    update: jest.fn(),
    updateGravity: jest.fn(),
  },
}));
jest.mock("../../services/systemService.js", () => ({
  __esModule: true,
  default: {
    reboot: jest.fn(),
    upgradeHost: jest.fn(),
  },
}));
jest.mock("../../helpers/index.js");

describe("CLI controllers", () => {
  const ctx = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["statusController", piholeService.getStatus],
    ["enableController", piholeService.enable],
    ["disableController", piholeService.disable],
    ["versionController", piholeService.getVersion],
    ["updatePiholeController", piholeService.update],
    ["upgravityController", piholeService.updateGravity],
    ["rebootController", systemService.reboot],
    ["upgradeController", systemService.upgradeHost],
  ])("delegates %s to its service", async (controllerName, serviceMethod) => {
    await cliController[controllerName](ctx);

    expect(serviceMethod).toHaveBeenCalledWith(expect.any(Function));
  });

  it("adapts service output to Telegram messages", async () => {
    piholeService.getStatus.mockImplementation((onOutput) => {
      onOutput("Pi-hole is enabled");
      return Promise.resolve();
    });

    await cliController.statusController(ctx);

    expect(sendMessage).toHaveBeenCalledWith(ctx, "Pi-hole is enabled");
  });

  it("propagates service failures", async () => {
    systemService.upgradeHost.mockRejectedValue(new Error("upgrade failed"));

    await expect(cliController.upgradeController(ctx)).rejects.toThrow(
      "upgrade failed"
    );
  });
});

import { sendOutputTo } from "../../shared/telegram/sendMessage.js";
import { reboot, upgradeHost } from "./service.js";

export const rebootCommand = {
  trigger: ["reboot", "r"],
  description: "Reboot the Raspberry Pi",
  handler: (ctx) => reboot(sendOutputTo(ctx)),
};

export const upgradeCommand = {
  trigger: ["upgrade", "upg"],
  description: "Upgrade host system",
  handler: (ctx) => upgradeHost(sendOutputTo(ctx)),
};

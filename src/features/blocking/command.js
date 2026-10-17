import { sendOutputTo } from "../../shared/telegram/sendMessage.js";
import { disable, enable, getStatus } from "./service.js";

export const statusCommand = {
  trigger: ["status", "s"],
  description: "Display the running status of Pi-hole subsystems",
  handler: (ctx) => getStatus(sendOutputTo(ctx)),
};

export const enableCommand = {
  trigger: ["enable", "e"],
  description: "Enable Pi-hole subsystems",
  handler: (ctx) => enable(sendOutputTo(ctx)),
};

export const disableCommand = {
  trigger: ["disable", "d"],
  description: "Disable Pi-hole subsystems",
  handler: (ctx) => disable(sendOutputTo(ctx)),
};

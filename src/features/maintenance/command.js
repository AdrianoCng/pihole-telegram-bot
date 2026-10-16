import { sendOutputTo } from "../../shared/telegram/sendMessage.js";
import { getVersion, update, updateGravity } from "./service.js";

export const versionCommand = {
  trigger: ["version", "v"],
  description: "Show installed version of Pi-hole, Web Interface & FTL",
  handler: (ctx) => getVersion(sendOutputTo(ctx)),
};

export const updateCommand = {
  trigger: ["update", "up"],
  description: "Update Pi-hole subsystems",
  handler: (ctx) => update(sendOutputTo(ctx)),
};

export const upgravityCommand = {
  trigger: ["upgravity", "g"],
  description: "Update the list of ad-serving domains",
  handler: (ctx) => updateGravity(sendOutputTo(ctx)),
};

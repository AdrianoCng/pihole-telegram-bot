import { botVersionCommand } from "../features/about/command.js";
import { disableCommand, enableCommand, statusCommand } from "../features/blocking/command.js";
import {
  upgravityCommand,
  updateCommand,
  versionCommand,
} from "../features/maintenance/command.js";
import { messagesCommand } from "../features/messages/command.js";
import { pauseAction, pauseCommand } from "../features/pause/command.js";
import { recentCommand } from "../features/recent/command.js";
import { authorizeCommand, logoutCommand } from "../features/session/command.js";
import { summaryCommand } from "../features/summary/command.js";
import { rebootCommand, upgradeCommand } from "../features/system/command.js";
import { topCommand } from "../features/top/command.js";
import sendMessage from "../shared/telegram/sendMessage.js";
import { mainMenu } from "./registry.js";

const menuCommand = {
  trigger: ["menu"],
  description: "Show the menu",
  handler: (ctx) => sendMessage(ctx, "Here are the available commands:", mainMenu(COMMANDS)),
  showInKeyboard: false,
};

/** Every command in menu and /help order. Adding a command is one entry here. */
export const COMMANDS = [
  summaryCommand,
  topCommand,
  recentCommand,
  statusCommand,
  messagesCommand,
  authorizeCommand,
  logoutCommand,
  enableCommand,
  disableCommand,
  pauseCommand,
  versionCommand,
  updateCommand,
  upgravityCommand,
  rebootCommand,
  upgradeCommand,
  botVersionCommand,
  menuCommand,
];

/** Inline keyboard callbacks, matched by pattern. */
export const ACTIONS = [pauseAction];

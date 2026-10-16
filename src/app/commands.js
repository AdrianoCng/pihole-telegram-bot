import * as apiController from "../controllers/apiController.js";
import * as cliController from "../controllers/cliController.js";
import * as botController from "../controllers/botController.js";
import * as summaryController from "../controllers/summaryController.js";
import * as pauseController from "../controllers/pauseController.js";
import * as topController from "../controllers/topController.js";
import * as recentController from "../controllers/recentController.js";
import { PAUSE_ACTION_PATTERN } from "../constants/pause.js";
import sendMessage from "../shared/telegram/sendMessage.js";
import { mainMenu } from "./registry.js";

/** Every command in menu and /help order. Adding a command is one entry here. */
export const COMMANDS = [
  {
    trigger: ["summary", "stats"],
    description: "Show Pi-hole health and activity summary",
    handler: summaryController.summaryController,
  },
  {
    trigger: ["top", "t"],
    description: "Show top blocked domains and clients",
    handler: topController.topController,
  },
  {
    trigger: ["recent", "rc"],
    description: "Show recently blocked domains, optionally for one client or domain",
    handler: recentController.recentController,
  },
  {
    trigger: ["status", "s"],
    description: "Display the running status of Pi-hole subsystems",
    handler: cliController.statusController,
  },
  {
    trigger: ["messages", "m"],
    description: "Show messages from Pi-hole",
    handler: apiController.messagesController,
  },
  {
    trigger: ["authorize", "a"],
    description: "Authorize the bot",
    handler: apiController.authorizeController,
  },
  {
    trigger: ["logout", "logoff"],
    description: "Logout the bot",
    handler: apiController.logoutController,
  },
  {
    trigger: ["enable", "e"],
    description: "Enable Pi-hole subsystems",
    handler: cliController.enableController,
  },
  {
    trigger: ["disable", "d"],
    description: "Disable Pi-hole subsystems",
    handler: cliController.disableController,
  },
  {
    trigger: ["pause", "p"],
    description: "Temporarily disable blocking",
    handler: pauseController.pauseController,
  },
  {
    trigger: ["version", "v"],
    description: "Show installed version of Pi-hole, Web Interface & FTL",
    handler: cliController.versionController,
  },
  {
    trigger: ["update", "up"],
    description: "Update Pi-hole subsystems",
    handler: cliController.updatePiholeController,
  },
  {
    trigger: ["upgravity", "g"],
    description: "Update the list of ad-serving domains",
    handler: cliController.upgravityController,
  },
  {
    trigger: ["reboot", "r"],
    description: "Reboot the Raspberry Pi",
    handler: cliController.rebootController,
  },
  {
    trigger: ["upgrade", "upg"],
    description: "Upgrade host system",
    handler: cliController.upgradeController,
  },
  {
    trigger: ["bot", "bv"],
    description: "Show the version of the bot",
    handler: botController.botVersionController,
  },
  {
    trigger: ["menu"],
    description: "Show the menu",
    handler: (ctx) => sendMessage(ctx, "Here are the available commands:", mainMenu(COMMANDS)),
    showInKeyboard: false,
  },
];

/** Inline keyboard callbacks, matched by pattern. */
export const ACTIONS = [
  {
    trigger: PAUSE_ACTION_PATTERN,
    handler: pauseController.pauseActionController,
  },
];

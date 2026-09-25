import * as apiController from "../controllers/apiController.js";
import * as cliController from "../controllers/cliController.js";
import * as botController from "../controllers/botController.js";
import * as summaryController from "../controllers/summaryController.js";

export const COMMANDS = [
  {
    trigger: ["summary", "stats"],
    description: "Show Pi-hole health and activity summary",
    handler: summaryController.summaryController,
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
    handler: botController.menuController,
    showInKeyboard: false,
  },
];

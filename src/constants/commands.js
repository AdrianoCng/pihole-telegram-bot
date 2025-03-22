import apiController from "../controllers/apiController.js";
import cliController from "../controllers/cliController.js";

export const COMMANDS = [
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
    trigger: ["messages", "m"],
    description: "Show messages from Pi-hole",
    handler: apiController.messagesController,
  },
  {
    trigger: ["status", "s"],
    description: "Display the running status of Pi-hole subsystems",
    handler: cliController.statusController,
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
];

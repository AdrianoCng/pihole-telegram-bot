import createAuthorizeCommand from "./authorize.js";
import createLogoutCommand from "./logout.js";
import createMessagesCommand from "./messages.js";
import createStatusCommand from "./status.js";
import createEnableCommand from "./enable.js";
import createDisableCommand from "./disable.js";
import createVersionCommand from "./version.js";
import createUpdateCommand from "./update.js";
import createUpgravityCommand from "./upgravity.js";
import createRebootCommand from "./reboot.js";
import createUpgradeCommand from "./upgrade.js";
import createBotVersionCommand from "./botVersion.js";
import createMenuCommand from "./menu.js";

export const commandFactories = [
  createAuthorizeCommand,
  createLogoutCommand,
  createMessagesCommand,
  createStatusCommand,
  createEnableCommand,
  createDisableCommand,
  createVersionCommand,
  createUpdateCommand,
  createUpgravityCommand,
  createRebootCommand,
  createUpgradeCommand,
  createBotVersionCommand,
  createMenuCommand,
];

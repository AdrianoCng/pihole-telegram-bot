import { spawnPiholeCommand } from "../helpers.js";
import { CLI_COMMANDS } from "../constants/cli.js";

const statusController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.STATUS]);
};

const enableController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.ENABLE]);
};

const disableController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.DISABLE]);
};

const versionController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.VERSION]);
};

const updatePiholeController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.UPDATE]);
};

const upgravityController = async (ctx) => {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.UPGRAVITY]);
};

export default {
  statusController,
  enableController,
  disableController,
  versionController,
  updatePiholeController,
  upgravityController,
};

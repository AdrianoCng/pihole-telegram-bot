import { spawnPiholeCommand, execCommandWithOutput } from "../helpers/index.js";
import { CLI_COMMANDS } from "../constants/cli.js";

export async function statusController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.STATUS]);
}

export async function enableController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.ENABLE]);
}

export async function disableController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.DISABLE]);
}

export async function versionController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.VERSION]);
}

export async function updatePiholeController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.UPDATE]);
}

export async function upgravityController(ctx) {
  await spawnPiholeCommand(ctx, [CLI_COMMANDS.UPGRAVITY]);
}

export async function rebootController(ctx) {
  await execCommandWithOutput(ctx, "reboot");
}

export async function upgradeController(ctx) {
  await execCommandWithOutput(ctx, "apt-get", ["update"]);
  await execCommandWithOutput(ctx, "apt-get", ["full-upgrade", "-y"]);
  await execCommandWithOutput(ctx, "apt-get", ["autoremove", "-y"]);
  await execCommandWithOutput(ctx, "apt-get", ["clean"]);
}

export default {
  statusController,
  enableController,
  disableController,
  versionController,
  updatePiholeController,
  upgravityController,
  rebootController,
  upgradeController,
};

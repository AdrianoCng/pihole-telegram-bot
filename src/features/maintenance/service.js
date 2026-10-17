import { spawnPiholeCommand, CLI_COMMANDS } from "../../pihole/cli.js";

export function getVersion(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.VERSION], onOutput);
}

export function update(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPDATE], onOutput);
}

export function updateGravity(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.UPGRAVITY], onOutput);
}

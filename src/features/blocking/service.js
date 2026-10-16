import { spawnPiholeCommand, CLI_COMMANDS } from "../../pihole/cli.js";

export function getStatus(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.STATUS], onOutput);
}

export function enable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.ENABLE], onOutput);
}

export function disable(onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE], onOutput);
}

import { spawnPiholeCommand, CLI_COMMANDS } from "../../pihole/cli.js";

export function pause(seconds, onOutput) {
  return spawnPiholeCommand([CLI_COMMANDS.DISABLE, `${seconds}s`], onOutput);
}

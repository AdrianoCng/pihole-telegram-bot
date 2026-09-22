import execCommandWithOutput from "./execCommandWithOutput.js";

/**
 * Run a Pi-hole command and report output through a transport-neutral callback.
 * @param {string[]} args
 * @param {(output: string) => void} onOutput
 * @returns {Promise<void>}
 */
export default function spawnPiholeCommand(args, onOutput) {
  return execCommandWithOutput("pihole", args, onOutput);
}

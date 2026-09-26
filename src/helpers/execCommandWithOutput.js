import { spawn } from "child_process";
import { COMMAND_TIMEOUT_MS } from "../constants/timers.js";
import CommandError from "../errors/CommandError.js";

/**
 * Run a command with sudo and report each output chunk through a transport-neutral callback.
 * @param {string} command
 * @param {string[]} args
 * @param {(output: string) => void} onOutput
 * @returns {Promise<void>}
 */
export default function execCommandWithOutput(
  command,
  args = [],
  onOutput = () => {}
) {
  return new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(COMMAND_TIMEOUT_MS);
    const process = spawn("sudo", ["-n", command, ...args], { signal });

    process.stdout.on("data", (chunk) => {
      onOutput(chunk.toString());
    });

    process.stderr.on("data", (chunk) => {
      onOutput(chunk.toString());
    });

    process.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new CommandError(code));
      }
    });

    process.once("error", reject);
  });
}

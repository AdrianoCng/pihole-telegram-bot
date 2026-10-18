import { spawn } from "child_process";
import { COMMAND_TIMEOUT_MS } from "./timers.js";
import { CommandError, CommandTimeoutError } from "./errors/CommandError.js";

/**
 * Run a command with sudo and report each output chunk through a transport-neutral callback.
 * @param {string} command
 * @param {string[]} args
 * @param {(output: string) => void} onOutput
 * @returns {Promise<void>}
 */
export function execCommandWithOutput(command, args = [], onOutput = () => {}) {
  return new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(COMMAND_TIMEOUT_MS);
    const process = spawn("sudo", ["-n", command, ...args], { signal });
    const commandLine = [command, ...args].join(" ");
    const fail = (details) => {
      const ErrorClass = signal.aborted ? CommandTimeoutError : CommandError;
      reject(new ErrorClass({ command: commandLine, ...details }));
    };

    process.stdout.on("data", (chunk) => {
      onOutput(chunk.toString());
    });

    process.stderr.on("data", (chunk) => {
      onOutput(chunk.toString());
    });

    process.once("close", (code, exitSignal) => {
      if (code === 0) {
        resolve();
      } else {
        fail({ exitCode: code ?? undefined, signal: exitSignal ?? undefined });
      }
    });

    process.once("error", (error) => {
      fail({ cause: error });
    });
  });
}

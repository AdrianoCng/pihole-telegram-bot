import { spawn as defaultSpawn } from "child_process";

/** @implements {import('../contracts/index.js').CommandExecutor} */
export default class CommandExecutor {
  #messageSender;
  #spawn;

  /**
   * @param {Object} options
   * @param {import('../contracts/index.js').MessageSender} options.messageSender
   * @param {typeof import('child_process').spawn} [options.spawn]
   */
  constructor({ messageSender, spawn = defaultSpawn }) {
    this.#messageSender = messageSender;
    this.#spawn = spawn;
  }

  /**
   * @param {any} ctx
   * @param {string} command
   * @param {string[]} [args]
   * @returns {Promise<void>}
   */
  exec(ctx, command, args = []) {
    return new Promise((resolve, reject) => {
      const process = this.#spawn("sudo", [command, ...args]);

      process.stdout.on("data", (chunk) => {
        this.#messageSender.send(ctx, chunk.toString());
      });

      process.stderr.on("data", (chunk) => {
        this.#messageSender.send(ctx, chunk.toString());
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const errorMessage = `Command failed with exit code ${code}`;
          this.#messageSender.send(ctx, errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }
}

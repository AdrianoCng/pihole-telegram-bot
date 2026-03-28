/** @implements {import('../contracts/index.js').PiholeExecutor} */
export default class PiholeCommandExecutor {
  #commandExecutor;

  /**
   * @param {Object} options
   * @param {import('../contracts/index.js').CommandExecutor} options.commandExecutor
   */
  constructor({ commandExecutor }) {
    this.#commandExecutor = commandExecutor;
  }

  /**
   * @param {any} ctx
   * @param {string[]} args
   * @returns {Promise<void>}
   */
  exec(ctx, args) {
    return this.#commandExecutor.exec(ctx, "pihole", args);
  }
}

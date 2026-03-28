/** @implements {import('../contracts/index.js').Config} */
export default class Config {
  #env;

  /**
   * @param {Record<string, string>} env
   */
  constructor(env) {
    this.#env = env;
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  get(key) {
    const value = this.#env[key];
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}

const DEFAULT_EMOJI_MAP = new Map([
  ["[✓]", "✅"],
  ["[✗]", "❌"],
  ["[i]", "ℹ️"],
]);

/** @implements {import('../contracts/index.js').MessageSender} */
export default class MessageSender {
  #emojiMap;

  /**
   * @param {Object} [options]
   * @param {Map<string, string>} [options.emojiMap]
   */
  constructor({ emojiMap = DEFAULT_EMOJI_MAP } = {}) {
    this.#emojiMap = emojiMap;
  }

  /**
   * @param {any} ctx
   * @param {string} message
   * @param {any} [extra]
   */
  send(ctx, message, extra) {
    let formatted = message;

    this.#emojiMap.forEach((emoji, key) => {
      formatted = formatted.replaceAll(key, emoji);
    });

    return ctx.reply(formatted, extra);
  }
}

export function sendMessage(ctx, message, extra) {
  const emojiMap = new Map([
    ["[✓]", "✅"],
    ["[✗]", "❌"],
    ["[i]", "ℹ️"],
  ]);

  emojiMap.forEach((emoji, key) => {
    message = message.replaceAll(key, emoji);
  });

  return ctx.reply(message, extra);
}

/** Stream command output to the chat, one reply per chunk. */
export function sendOutputTo(ctx) {
  return (output) => sendMessage(ctx, output);
}

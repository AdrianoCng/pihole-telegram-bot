export default function sendMessage(ctx, message, extra) {
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

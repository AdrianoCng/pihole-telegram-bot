export default function sendMessage(ctx, message) {
  const emojiMap = new Map([
    ["[✓]", "✅"],
    ["[✗]", "❌"],
    ["[i]", "ℹ️"],
  ]);

  emojiMap.forEach((emoji, key) => {
    message = message.replaceAll(key, emoji);
  });

  ctx.reply(message);
}

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').Config} deps.config
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 */
export default function createAuthMiddleware({ config, messageSender }) {
  return async (ctx, next) => {
    if (config.get("ALLOWED_USER") !== ctx.from.id.toString()) {
      messageSender.send(
        ctx,
        "⛔️ Unauthorized access! You are not allowed to use this bot."
      );
      return;
    }

    await next();
  };
}

import { sendMessage } from "../helpers.js";

export default async (ctx, next) => {
  if (process.env.ALLOWED_USER !== ctx.from.id.toString()) {
    sendMessage(
      ctx,
      "⛔️ Unauthorized access! You are not allowed to use this bot."
    );

    return;
  }

  await next();
};

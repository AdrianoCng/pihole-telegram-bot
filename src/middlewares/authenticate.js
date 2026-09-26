import { getEnv } from "../helpers/config.js";
import { sendMessage } from "../helpers/index.js";

export default async (ctx, next) => {
  if (getEnv("ALLOWED_USER") !== ctx.from.id.toString()) {
    return sendMessage(
      ctx,
      "⛔️ Unauthorized access! You are not allowed to use this bot."
    );
  }

  await next();
};

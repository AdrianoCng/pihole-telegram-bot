import { env } from "../../config.js";
import { sendMessage } from "../../shared/telegram/sendMessage.js";

export async function authenticate(ctx, next) {
  if (env.ALLOWED_USER !== ctx.from.id.toString()) {
    return sendMessage(ctx, "⛔️ Unauthorized access! You are not allowed to use this bot.");
  }

  await next();
}

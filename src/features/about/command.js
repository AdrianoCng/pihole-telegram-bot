import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { getBotVersion } from "./service.js";

export const botVersionCommand = {
  trigger: ["bot", "bv"],
  description: "Show the version of the bot",
  async handler(ctx) {
    const version = await getBotVersion();
    await sendMessage(ctx, `The bot version is v${version}`);
  },
};

import sendMessage from "../shared/telegram/sendMessage.js";
import botService from "../services/botService.js";

export async function botVersionController(ctx) {
  const version = await botService.getVersion();

  await sendMessage(ctx, `The bot version is v${version}`);
}

export default {
  botVersionController,
};

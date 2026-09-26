import { sendMessage, getMainMenu } from "../helpers/index.js";
import botService from "../services/botService.js";

export async function botVersionController(ctx) {
  const version = await botService.getVersion();

  await sendMessage(ctx, `The bot version is v${version}`);
}

export async function menuController(ctx) {
  await sendMessage(ctx, "Here are the available commands:", getMainMenu());
}

export default {
  botVersionController,
  menuController,
};

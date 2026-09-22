import { sendMessage, getMainMenu } from "../helpers/index.js";
import botService from "../services/botService.js";

export async function botVersionController(ctx) {
  const version = await botService.getVersion();

  sendMessage(ctx, `The bot version is v${version}`);
}

export async function menuController(ctx) {
  sendMessage(ctx, "Here are the available commands:", getMainMenu());
}

export default {
  botVersionController,
  menuController,
};

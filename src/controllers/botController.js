import { sendMessage, getMainMenu } from "../helpers/index.js";
import fs from "fs/promises";

export async function botVersionController(ctx) {
  const packageJson = await fs.readFile(
    new URL("../../package.json", import.meta.url),
    "utf8"
  );
  const version = JSON.parse(packageJson).version;

  sendMessage(ctx, `The bot version is v${version}`);
}

export async function menuController(ctx) {
  sendMessage(ctx, "Here are the available commands:", getMainMenu());
}

export default {
  botVersionController,
  menuController,
};

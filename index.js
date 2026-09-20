import "dotenv/config";
import bot from "./src/bot.js";
import { COMMANDS } from "./src/constants/commands.js";

const telegramCommands = COMMANDS.map(({ trigger, description }) => ({
  command: Array.isArray(trigger) ? trigger[0] : trigger,
  description,
}));

await bot.telegram.setMyCommands(telegramCommands).catch((err) => {
  console.error("[warn] Failed to register commands with Telegram:", err.message);
});
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

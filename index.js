import "dotenv/config";
import bot from "./src/bot.js";
import api from "./src/api.js";
import { API_ENDPOINTS } from "./src/constants/api.js";
import { COMMANDS } from "./src/constants/commands.js";
import { logSafeError } from "./src/helpers/logSafeError.js";
import piholeService from "./src/services/piholeService.js";

const SHUTDOWN_LOGOUT_TIMEOUT_MS = 1000;

const telegramCommands = COMMANDS.map(({ trigger, description }) => ({
  command: Array.isArray(trigger) ? trigger[0] : trigger,
  description,
}));

await bot.telegram.setMyCommands(telegramCommands).catch((err) => {
  console.error("[warn] Failed to register commands with Telegram:", err.message);
});
bot.launch();

// End the Pi-hole API session best-effort so restarts do not leak sessions.
async function shutdown(signal) {
  if (api.hasSession()) {
    try {
      await piholeService.logout({
        signal: AbortSignal.timeout(SHUTDOWN_LOGOUT_TIMEOUT_MS),
      });
    } catch (error) {
      logSafeError({ operation: "logout", path: API_ENDPOINTS.AUTH, error });
    }
  }

  bot.stop(signal);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

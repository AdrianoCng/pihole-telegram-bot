import "dotenv/config";
import { createBot } from "./src/app/createBot.js";
import { COMMANDS } from "./src/app/commands.js";
import { toTelegramCommands } from "./src/app/registry.js";
import { validateConfig } from "./src/config.js";
import api from "./src/pihole/client.js";
import { API_ENDPOINTS } from "./src/pihole/endpoints.js";
import { endSession } from "./src/pihole/session.js";
import { logSafeError } from "./src/shared/logSafeError.js";
import { SHUTDOWN_LOGOUT_TIMEOUT_MS } from "./src/shared/timers.js";

try {
  validateConfig();
} catch (error) {
  console.error(`[error] ${error.message}. See .env.example.`);
  process.exit(1);
}

const bot = createBot();

await bot.telegram.setMyCommands(toTelegramCommands(COMMANDS)).catch((err) => {
  console.error("[warn] Failed to register commands with Telegram:", err.message);
});
bot.launch();

// End the Pi-hole API session best-effort so restarts do not leak sessions.
async function shutdown(signal) {
  if (api.hasSession()) {
    try {
      await endSession({
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

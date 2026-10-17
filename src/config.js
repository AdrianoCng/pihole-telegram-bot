import { bool, cleanEnv, str, url } from "envalid";

/** Validated, immutable configuration. Missing or invalid values exit at import. */
export const env = cleanEnv(process.env, {
  BOT_TOKEN: str({ desc: "Telegram bot token from @BotFather", example: "123456:ABC-DEF" }),
  PIHOLE_IP: url({ desc: "Pi-hole base URL including protocol", example: "http://192.168.1.100" }),
  PIHOLE_PASSWORD: str({ desc: "Pi-hole web password; may be empty" }),
  ALLOWED_USER: str({ desc: "Telegram user ID allowed to use the bot", example: "123456789" }),
  DEBUG: bool({ default: false, desc: "Include error details in replies and logs" }),
});

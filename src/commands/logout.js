import { API_ENDPOINTS } from "../constants/api.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').HttpClient} deps.httpClient
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createLogoutCommand({ httpClient, messageSender }) {
  return {
    trigger: ["logout", "logoff"],
    description: "Logout the bot",
    async handler(ctx) {
      await httpClient.delete(API_ENDPOINTS.AUTH);
      httpClient.setHeader("sid", "");
      messageSender.send(ctx, "✅ Logged out successfully");
    },
  };
}

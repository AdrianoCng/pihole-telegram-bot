import { API_ENDPOINTS } from "../constants/api.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').HttpClient} deps.httpClient
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 * @param {import('../contracts/index.js').Config} deps.config
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createAuthorizeCommand({ httpClient, messageSender, config }) {
  return {
    trigger: ["authorize", "a"],
    description: "Authorize the bot",
    async handler(ctx) {
      const response = await httpClient.post(API_ENDPOINTS.AUTH, {
        password: config.get("PIHOLE_PASSWORD"),
      });

      if (!response || !response.session || !response.session.sid) {
        messageSender.send(ctx, "❌ Authorization failed: Invalid response from server");
        return;
      }

      httpClient.setHeader("sid", response.session.sid);
      messageSender.send(ctx, "✅ Authorized successfully");
    },
  };
}

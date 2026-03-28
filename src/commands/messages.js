import { API_ENDPOINTS } from "../constants/api.js";

/**
 * @param {Object} deps
 * @param {import('../contracts/index.js').HttpClient} deps.httpClient
 * @param {import('../contracts/index.js').MessageSender} deps.messageSender
 * @returns {import('../contracts/index.js').CommandDefinition}
 */
export default function createMessagesCommand({ httpClient, messageSender }) {
  return {
    trigger: ["messages", "m"],
    description: "Show messages from Pi-hole",
    async handler(ctx) {
      const response = await httpClient.get(API_ENDPOINTS.INFO.MESSAGES);

      if (!response || !response.messages) {
        messageSender.send(ctx, "❌ Failed to retrieve messages: Invalid response from server");
        return;
      }

      const messages = response.messages;

      if (messages.length === 0) {
        messageSender.send(ctx, "No messages found");
        return;
      }

      messageSender.send(
        ctx,
        messages
          .map((m) => {
            const date = new Date(m.timestamp * 1000);
            const formattedDate = date.toLocaleString();
            return `${formattedDate} - ${m.plain}`;
          })
          .join("\n")
      );
    },
  };
}

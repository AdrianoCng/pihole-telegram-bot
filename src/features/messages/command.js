import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { getMessages } from "./service.js";

export const messagesCommand = {
  trigger: ["messages", "m"],
  description: "Show messages from Pi-hole",
  async handler(ctx) {
    const messages = await getMessages();

    if (messages === null) {
      await sendMessage(ctx, "❌ Failed to retrieve messages: Invalid response from server");
      return;
    }

    if (messages.length === 0) {
      await sendMessage(ctx, "No messages found");
      return;
    }

    await sendMessage(
      ctx,
      messages
        .map((message) => {
          const date = new Date(message.timestamp * 1000);
          return `${date.toLocaleString()} - ${message.plain}`;
        })
        .join("\n")
    );
  },
};

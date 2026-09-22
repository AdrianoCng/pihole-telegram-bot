import { getEnv } from "../helpers/config.js";
import api from "../api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { sendMessage } from "../helpers/index.js";

export async function authorizeController(ctx) {
  const response = await api.post(API_ENDPOINTS.AUTH, {
    password: getEnv("PIHOLE_PASSWORD"),
  });

  if (!response || !response.session || !response.session.sid) {
    sendMessage(ctx, "❌ Authorization failed: Invalid response from server");
    return;
  }

  api.setHeader("sid", response.session.sid);

  sendMessage(ctx, "✅ Authorized successfully");
}

export async function logoutController(ctx) {
  await api.delete(API_ENDPOINTS.AUTH);
  api.setHeader("sid", "");

  sendMessage(ctx, "✅ Logged out successfully");
}

export async function messagesController(ctx) {
  const response = await api.get(API_ENDPOINTS.INFO.MESSAGES);

  if (!response || !response.messages) {
    sendMessage(ctx, "❌ Failed to retrieve messages: Invalid response from server");
    return;
  }

  const messages = response.messages;

  if (messages.length === 0) {
    sendMessage(ctx, "No messages found");
    return;
  }

  sendMessage(
    ctx,
    messages
      .map((m) => {
        const date = new Date(m.timestamp * 1000);
        const formattedDate = date.toLocaleString();

        return `${formattedDate} - ${m.plain}`;
      })
      .join("\n")
  );
}

export default { authorizeController, logoutController, messagesController };

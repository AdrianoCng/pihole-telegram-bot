import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";

export async function authorizeController(ctx) {
  const authorized = await piholeService.authorize();

  if (!authorized) {
    sendMessage(ctx, "❌ Authorization failed: Invalid response from server");
    return;
  }

  sendMessage(ctx, "✅ Authorized successfully");
}

export async function logoutController(ctx) {
  await piholeService.logout();
  sendMessage(ctx, "✅ Logged out successfully");
}

export async function messagesController(ctx) {
  const messages = await piholeService.getMessages();

  if (messages === null) {
    sendMessage(ctx, "❌ Failed to retrieve messages: Invalid response from server");
    return;
  }

  if (messages.length === 0) {
    sendMessage(ctx, "No messages found");
    return;
  }

  sendMessage(
    ctx,
    messages
      .map((message) => {
        const date = new Date(message.timestamp * 1000);
        return `${date.toLocaleString()} - ${message.plain}`;
      })
      .join("\n")
  );
}

export default { authorizeController, logoutController, messagesController };

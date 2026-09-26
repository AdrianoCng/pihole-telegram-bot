import piholeService from "../services/piholeService.js";
import { sendMessage } from "../helpers/index.js";

export async function authorizeController(ctx) {
  const authorized = await piholeService.authorize();

  if (!authorized) {
    await sendMessage(ctx, "❌ Authorization failed: Invalid response from server");
    return;
  }

  await sendMessage(ctx, "✅ Authorized successfully");
}

export async function logoutController(ctx) {
  await piholeService.logout();
  await sendMessage(ctx, "✅ Logged out successfully");
}

export async function messagesController(ctx) {
  const messages = await piholeService.getMessages();

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
}

export default { authorizeController, logoutController, messagesController };

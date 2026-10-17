import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { authorize, logout } from "./service.js";

export const authorizeCommand = {
  trigger: ["authorize", "a"],
  description: "Authorize the bot",
  async handler(ctx) {
    const authorized = await authorize();

    if (!authorized) {
      await sendMessage(ctx, "❌ Authorization failed: Invalid response from server");
      return;
    }

    await sendMessage(ctx, "✅ Authorized successfully");
  },
};

export const logoutCommand = {
  trigger: ["logout", "logoff"],
  description: "Logout the bot",
  async handler(ctx) {
    await logout();
    await sendMessage(ctx, "✅ Logged out successfully");
  },
};

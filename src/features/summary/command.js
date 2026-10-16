import sendMessage from "../../shared/telegram/sendMessage.js";
import { renderSummary } from "./format.js";
import { getSummary } from "./service.js";

export const summaryCommand = {
  trigger: ["summary", "stats"],
  description: "Show Pi-hole health and activity summary",
  async handler(ctx) {
    const summary = await getSummary();
    await sendMessage(ctx, renderSummary(summary, Date.now()));
  },
};

import sendMessage from "../../shared/telegram/sendMessage.js";
import { renderTop } from "./format.js";
import { getTop } from "./service.js";

export const topCommand = {
  trigger: ["top", "t"],
  description: "Show top blocked domains and clients",
  async handler(ctx) {
    const top = await getTop();
    await sendMessage(ctx, renderTop(top), { parse_mode: "HTML" });
  },
};

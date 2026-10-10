import piholeService from "../services/piholeService.js";
import sendMessage from "../helpers/sendMessage.js";
import { renderRecent } from "../helpers/recentFormat.js";

export async function recentController(ctx) {
  const entries = await piholeService.getRecentBlocked();
  await sendMessage(ctx, renderRecent(entries, Date.now()), { parse_mode: "HTML" });
}

export default { recentController };

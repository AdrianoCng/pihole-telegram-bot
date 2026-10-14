import piholeService from "../services/piholeService.js";
import sendMessage from "../helpers/sendMessage.js";
import { parseRecentFilter } from "../helpers/recentFilter.js";
import { renderRecent } from "../helpers/recentFormat.js";

const USAGE_MESSAGE =
  "Send /recent, /recent <client IP or hostname>, or /recent domain <domain>, e.g. /recent 192.168.1.5 or /recent domain ads.example.com.";

export async function recentController(ctx) {
  const filter = parseRecentFilter(ctx.payload);

  if (filter === null) {
    await sendMessage(ctx, `❌ Invalid filter. ${USAGE_MESSAGE}`);
    return;
  }

  const entries = await piholeService.getRecentBlocked(
    filter.type === "all" ? undefined : { param: filter.param, value: filter.value }
  );
  await sendMessage(ctx, renderRecent(entries, Date.now(), filter), { parse_mode: "HTML" });
}

export default { recentController };

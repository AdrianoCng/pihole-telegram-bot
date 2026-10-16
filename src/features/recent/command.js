import sendMessage from "../../shared/telegram/sendMessage.js";
import { parseRecentFilter } from "./filter.js";
import { renderRecent } from "./format.js";
import { getRecentBlocked } from "./service.js";

const USAGE_MESSAGE =
  "Send /recent, /recent <client IP or hostname>, or /recent domain <domain>, e.g. /recent 192.168.1.5 or /recent domain ads.example.com. Use * as a wildcard, e.g. /recent 192.168.1.* or /recent domain *.example.com.";

export const recentCommand = {
  trigger: ["recent", "rc"],
  description: "Show recently blocked domains, optionally for one client or domain",
  async handler(ctx) {
    const filter = parseRecentFilter(ctx.payload);

    if (filter === null) {
      await sendMessage(ctx, `❌ Invalid filter. ${USAGE_MESSAGE}`);
      return;
    }

    const entries = await getRecentBlocked(
      filter.type === "all" ? undefined : { param: filter.param, value: filter.value }
    );
    await sendMessage(ctx, renderRecent(entries, Date.now(), filter), { parse_mode: "HTML" });
  },
};

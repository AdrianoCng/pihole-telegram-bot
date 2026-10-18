import { code } from "../../shared/telegram/html.js";
import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { DOMAIN_LISTS } from "./constants.js";
import { renderDomains } from "./format.js";
import { parseDomainTarget } from "./parse.js";
import { addDomain, listDomains } from "./service.js";

function domainCommand(list, description) {
  const name = list.type;
  const usage = `Send /${name} <domain>, e.g. /${name} example.com or /${name} *.example.com`;

  return {
    trigger: [name],
    description,
    async handler(ctx) {
      const target = parseDomainTarget(ctx.payload);

      if (target === null) {
        await sendMessage(ctx, `❌ Invalid domain. ${usage}`);
        return;
      }

      const result = await addDomain(list, target);
      const message =
        result === "exists"
          ? `ℹ️ ${code(target.display)} is already on the ${list.label}`
          : `✅ Added ${code(target.display)} to the ${list.label}`;
      await sendMessage(ctx, message, { parse_mode: "HTML" });
    },
  };
}

export const allowCommand = domainCommand(
  DOMAIN_LISTS.allow,
  "Allow a domain, or *.domain for its subdomains too"
);

export const denyCommand = domainCommand(
  DOMAIN_LISTS.deny,
  "Block a domain, or *.domain for its subdomains too"
);

export const domainsCommand = {
  trigger: ["domains"],
  description: "List allowed and denied domains",
  async handler(ctx) {
    const entries = await listDomains();
    await sendMessage(ctx, renderDomains(entries), { parse_mode: "HTML" });
  },
};

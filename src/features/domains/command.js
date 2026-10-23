import { code } from "../../shared/telegram/html.js";
import { sendMessage } from "../../shared/telegram/sendMessage.js";
import { DOMAIN_LISTS } from "./constants.js";
import { renderCheck, renderDomains } from "./format.js";
import { parseCheckTarget, parseDomainTarget } from "./parse.js";
import { addDomain, checkDomain, listDomains, removeDomain } from "./service.js";

export const allowCommand = {
  trigger: ["allow"],
  description: "Allow a domain, or *.domain for its subdomains too",
  async handler(ctx) {
    const target = parseDomainTarget(ctx.payload);

    if (target === null) {
      await sendMessage(
        ctx,
        "❌ Invalid domain. Send /allow <domain>, e.g. /allow example.com or /allow *.example.com"
      );
      return;
    }

    const list = DOMAIN_LISTS.allow;
    const domain = code(target.display);
    const result = await addDomain(list, target);
    const message =
      result === "added"
        ? `✅ Added ${domain} to the ${list.label}`
        : `ℹ️ ${domain} is already on the ${list.label}`;

    await sendMessage(ctx, message, { parse_mode: "HTML" });
  },
};

export const denyCommand = {
  trigger: ["deny"],
  description: "Block a domain, or *.domain for its subdomains too",
  async handler(ctx) {
    const target = parseDomainTarget(ctx.payload);

    if (target === null) {
      await sendMessage(
        ctx,
        "❌ Invalid domain. Send /deny <domain>, e.g. /deny example.com or /deny *.example.com"
      );
      return;
    }

    const list = DOMAIN_LISTS.deny;
    const domain = code(target.display);
    const result = await addDomain(list, target);
    const message =
      result === "added"
        ? `✅ Added ${domain} to the ${list.label}`
        : `ℹ️ ${domain} is already on the ${list.label}`;

    await sendMessage(ctx, message, { parse_mode: "HTML" });
  },
};

export const unallowCommand = {
  trigger: ["unallow"],
  description: "Remove a domain from the allowlist",
  async handler(ctx) {
    const target = parseDomainTarget(ctx.payload);

    if (target === null) {
      await sendMessage(
        ctx,
        "❌ Invalid domain. Send /unallow <domain>, e.g. /unallow example.com or /unallow *.example.com"
      );
      return;
    }

    const list = DOMAIN_LISTS.allow;
    const domain = code(target.display);
    const result = await removeDomain(list, target);
    const message =
      result === "removed"
        ? `🗑️ Removed ${domain} from the ${list.label}`
        : `ℹ️ ${domain} is not on the ${list.label}`;

    await sendMessage(ctx, message, { parse_mode: "HTML" });
  },
};

export const undenyCommand = {
  trigger: ["undeny"],
  description: "Remove a domain from the denylist",
  async handler(ctx) {
    const target = parseDomainTarget(ctx.payload);

    if (target === null) {
      await sendMessage(
        ctx,
        "❌ Invalid domain. Send /undeny <domain>, e.g. /undeny example.com or /undeny *.example.com"
      );
      return;
    }

    const list = DOMAIN_LISTS.deny;
    const domain = code(target.display);
    const result = await removeDomain(list, target);
    const message =
      result === "removed"
        ? `🗑️ Removed ${domain} from the ${list.label}`
        : `ℹ️ ${domain} is not on the ${list.label}`;

    await sendMessage(ctx, message, { parse_mode: "HTML" });
  },
};

export const domainsCommand = {
  trigger: ["domains"],
  description: "List allowed and denied domains",
  async handler(ctx) {
    const entries = await listDomains();
    for (const message of renderDomains(entries)) {
      await sendMessage(ctx, message, { parse_mode: "HTML" });
    }
  },
};

export const checkCommand = {
  trigger: ["check"],
  description: "Show which rules match a domain",
  async handler(ctx) {
    const domain = parseCheckTarget(ctx.payload);

    if (domain === null) {
      await sendMessage(ctx, "❌ Invalid domain. Send /check <domain>, e.g. /check example.com");
      return;
    }

    await sendMessage(ctx, renderCheck(await checkDomain(domain)), { parse_mode: "HTML" });
  },
};

export const DOMAIN_LISTS = {
  allow: { type: "allow", label: "allowlist" },
  deny: { type: "deny", label: "denylist" },
};

export const DOMAIN_KINDS = {
  EXACT: "exact",
  REGEX: "regex",
};

export const GRAVITY_TYPES = {
  ALLOW: "allow",
  BLOCK: "block",
};

/** Most matches /check asks Pi-hole for, per category. */
export const SEARCH_LIMIT = 20;

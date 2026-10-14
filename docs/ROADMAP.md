# Roadmap: next features

Status: proposed. Written 2026-10-14 after reviewing the codebase at v1.4.0.

## Where the product is today

The bot is a single-user Telegram remote for Pi-hole (v6 REST API plus the `pihole` CLI).

- **Monitor:** `/summary`, `/top`, `/recent`, `/status`, `/messages`, `/version`
- **Control:** `/enable`, `/disable`, `/pause` (timed), `/update`, `/upgravity`, `/upgrade`, `/reboot`
- **Session:** `/authorize`, `/logout`, with automatic sign-in and refresh

Every interaction is pull-based and read-only against the traffic data. The bot cannot change what Pi-hole blocks, and it cannot tell the user something is wrong unless the user asks.

Two gaps follow from that:

1. `/top` and `/recent` show blocked domains, but the user cannot act on them from the chat. The usual follow-up ("this broke a site, unblock it") needs the Pi-hole web UI.
2. If Pi-hole is down, blocking has been left off, or gravity is stale, nothing says so until the user checks.

The four features below close those gaps, in priority order.

---

## 1. Filtered recent blocks (`/recent <client>`, `/recent domain <domain>`)

**Priority:** 1. Chosen as the first feature to implement. It is the smallest change and extends a command that already exists.

Spec: [`specs/recent-filters.md`](specs/recent-filters.md)

### Problem

`/recent` shows the last 10 blocked queries across the whole network. When one device or site is misbehaving, those 10 rows are usually from other clients, so the user cannot investigate it.

### Summary

- `/recent <client IP or hostname>` shows the latest blocked queries from one client.
- `/recent domain <domain>` shows the latest blocked queries for one domain, with the clients that asked.
- Plain `/recent` is unchanged.

---

## 2. Allow/deny list management (`/allow`, `/deny`, `/lists`)

**Priority:** 2. It is the most common reason to open the Pi-hole UI from a phone.

### Problem

A blocked domain breaks a site, app or smart device. Today the user sees it in `/recent` and then has to log in to the web UI to whitelist it.

### Goals

- Allow or deny a domain from Telegram in a few taps.
- Make the action one tap from the domains already shown by `/recent` and `/top`.
- Make every change easy to undo.

### User stories

- As the owner, I send `/allow example.com` and the domain is added to the allow list.
- As the owner, I send `/deny tracker.example.net` and the domain is added to the deny list.
- As the owner, I see "Allow" buttons under each `/recent` entry and tap one to allow that domain.
- As the owner, I send `/lists` to see the latest entries and remove one with a button.

### Behaviour

- Commands: `/allow <domain>`, `/deny <domain>`, `/lists`. Registered in `src/constants/commands.js`.
- Validation: add a domain validator to `src/helpers/validators.js`. Reject malformed input with a clear message. Exact domains only in v1; regex entries are out of scope.
- Reply format: confirm the action with the domain and the resulting list, plus an inline "Undo" button.
- `/allow` with no argument prompts for a domain, using the same pattern as the custom `/pause` flow.
- Inline buttons use the callback action constants in `src/constants/actions.js`.
- Idempotent: adding a domain that already exists replies "already on the list" instead of an error.

### Technical approach

- Pi-hole API: `POST /api/domains/{allow|deny}/exact` to add, `DELETE /api/domains/{type}/{kind}/{domain}` to remove, `GET /api/domains` to list.
- New `src/services/domainService.js` (follows the `piholeService` pattern and reuses the auto-reauth wrapper in `piholeSession.js`).
- New `src/controllers/domainController.js`. It stays thin and delegates to the service.
- Extend `recentFormat`/`topFormat` to optionally return an inline keyboard.
- Errors go through the existing `PiholeError` classification. Add messages to `src/constants/errorMessages.js`.

### Acceptance criteria

- Allowing and denying work for valid domains and fail cleanly for invalid ones.
- Undo restores the previous state.
- Duplicate adds are handled without an error reply.
- Unit tests cover the validator, service, formatter and command flow, matching the existing suites in `src/__tests__/`.
- README usage section and command registry updated.

### Risks

- A mistaken tap changes blocking behaviour. Mitigation: always show Undo and avoid auto-confirm on deny.
- Callback buttons must stay behind the `ALLOWED_USER` authentication middleware.

---

## 3. Domain lookup (`/query <domain>`)

**Priority:** 3. It answers "why is this broken?" and pairs with feature 2. Its query-history part overlaps with feature 1's `/recent domain`, so scope it down to list matches and status once feature 1 ships.

### Problem

`/recent` only shows the last 10 blocks. If a specific site or device is failing, the user cannot ask Pi-hole about it.

### Goals

- Tell the user whether a domain is blocked, which list or rule blocked it, and when it was last queried.
- Let the user go straight from the answer to allow or deny (feature 2).

### User stories

- As the owner, I send `/query example.com` and see whether it is allowed, blocked by gravity, or blocked by a deny rule.
- As the owner, I see which blocklist matched.
- As the owner, I see the last few queries for that domain with client and time.

### Behaviour

- Command: `/query <domain>` (alias `/q`). With no argument, prompt for one.
- Output: status (blocked, allowed, not seen), matching list or rule, last 5 queries, with the same time and client formatting as `/recent`.
- If the domain is blocked, show an "Allow" button. If it is allowed, show a "Deny" button.

### Technical approach

- Pi-hole API: `GET /api/search/{domain}` for list matches, `GET /api/queries?domain=...&length=5` for history.
- New `queryParsers.js` and `queryFormat.js` in `src/helpers/`, following the `recent*` pair, plus `queryController.js` and a `queryService` function.
- Reuse `htmlFormat` escaping, since domain strings are user input.

### Acceptance criteria

- Blocked, allowed and unknown domains each render correctly.
- Parser tests use fixture API responses, including empty results.
- Domain input is validated and HTML-escaped.

### Risks

- API response shape differs between Pi-hole v6 releases. Mitigation: parse defensively and cover missing fields in tests, as `recentParsers` does.

---

## 4. Proactive alerts and scheduled digest

**Priority:** 4. It is the largest change (the bot becomes push as well as pull), so it comes after the command-driven features.

### Problem

The bot only speaks when spoken to. A Pi-hole outage, blocking left disabled after a `/disable`, or a failed gravity update goes unnoticed. Because the bot runs on the same Pi as Pi-hole, it is well placed to notice.

### Goals

- Notify the owner when something needs attention.
- Optionally send a short periodic digest so the owner does not need to run `/summary`.

### User stories

- As the owner, I get a message if Pi-hole's API stops responding, and another when it recovers.
- As the owner, I get a reminder if blocking has been disabled for longer than a threshold.
- As the owner, I get a new Pi-hole message (from `/messages`) pushed to me when it appears.
- As the owner, I can opt in to a daily digest with queries, blocked percentage and top blocked domain.

### Behaviour

- Background monitor started from `index.js`, stopped on graceful shutdown alongside the existing session cleanup.
- Checks on an interval (default 60 s): API reachability, blocking state, new Pi-hole messages.
- Alerts fire on state change only (down, recovered, long-disabled) so there is no repeat spam. Use a small in-memory state machine.
- Configuration through `.env`, all optional with safe defaults:
  - `ALERTS_ENABLED` (default `false`, so upgrades change nothing)
  - `ALERT_DISABLED_AFTER` (e.g. `30m`, parsed with `helpers/duration.js`)
  - `DIGEST_TIME` (e.g. `08:00`, empty means off)
- Runtime control: `/alerts on|off` to mute without restarting.
- Messages go to `ALLOWED_USER`.

### Technical approach

- New `src/services/monitorService.js` (timers and state) and `src/controllers/alertsController.js` for the command.
- Reuse the summary service and `summaryFormat` for the digest.
- Add interval and timeout values to `src/constants/timers.js`. Use `AbortSignal` timeouts on every check, as the API client already supports.
- Persistence is not needed in v1. State resets on restart, and the alert state machine tolerates that.

### Acceptance criteria

- Outage and recovery each send exactly one message.
- No alerts when `ALERTS_ENABLED` is unset.
- Timers are cleared on shutdown. Tests use fake timers.
- Failed sends to Telegram are logged and do not crash the monitor.
- README documents the new environment variables.

### Risks

- Timer drift and overlapping checks. Mitigation: schedule the next check only after the previous one finishes.
- Unreachable-API alerts depend on the bot itself still running, so they do not cover a full Pi outage. This limitation should be documented.

---

## Considered and deferred

| Idea                               | Why not now                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| Multiple authorized users or roles | Changes the single-user security model. Revisit if requested.                                    |
| Per-client or per-group blocking   | Valuable but needs the groups/clients API surface and a larger UX. Candidate after features 1-4. |
| Charts as images                   | Nice to have, but adds a rendering dependency to a Raspberry Pi deployment.                      |
| Regex deny/allow rules             | Higher risk of accidental over-blocking. Add after exact-domain management proves out.           |

## Suggested order

1. Feature 1, which also introduces the domain and client input validation that later features reuse.
2. Feature 2, which builds the inline-keyboard action pattern.
3. Feature 3, which reuses that pattern and the domain validator.
4. Feature 4, which is independent and can start in parallel if needed.

Each ships as its own branch (`feat/recent-filters`, `feat/allow-deny-domains`, `feat/query-domain`, `feat/alerts`) following `docs/agent-guides/git-workflow.md`.

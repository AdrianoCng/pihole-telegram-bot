# Spec: filtered recent blocks

Status: implemented.

## Problem

`/recent` returns the 10 most recently blocked queries for the whole network. When one device or one site is misbehaving, the user has no way to narrow the list to it, so the rows that matter are usually pushed out by other clients' traffic. Investigating means opening the Pi-hole web UI.

## Goals

- Show recent blocked queries for one client, identified by IP or hostname.
- Show recent blocked queries for one domain, including which clients asked.
- Keep plain `/recent` exactly as it works today.

## Non-goals

- Allowed (non-blocked) queries. Filtered results stay blocked-only, consistent with `/recent`. Showing every status is a candidate follow-up.
- Pagination, custom result counts, or time ranges. The count stays at `RECENT_BLOCKED_COUNT` (10).
- Wildcard or regex domain matching.
- Allow/deny actions from the results. Planned separately.
- A new command. The filters are arguments of `/recent` and its alias `/rc`.

## User stories

- As the owner, I send `/recent 192.168.1.5` and see what was blocked for that device.
- As the owner, I send `/recent my-phone` and get the same by hostname.
- As the owner, I send `/recent domain ads.example.com` and see when it was blocked and by which clients.
- As the owner, I mistype a filter and get a short usage message instead of an error.

## UX

| Input                                                   | Behaviour                                      |
| ------------------------------------------------------- | ---------------------------------------------- |
| `/recent`                                               | Unchanged: latest blocked queries, all clients |
| `/recent <IP>`                                          | Filter by client IP (IPv4 or IPv6)             |
| `/recent <hostname>`                                    | Filter by client name                          |
| `/recent domain <domain>`                               | Filter by exact domain                         |
| `/rc ...`                                               | Same as `/recent ...`                          |
| Anything else (e.g. `domain`, `a b`, unsafe characters) | Usage message, no Pi-hole call                 |

Parsing rules:

- The payload is trimmed and split on `\s+`. An empty payload (including whitespace only, as in `/recent   `) is plain `/recent`.
- A single token equal to `domain` (case-insensitive) is invalid. This check comes first, so `domain` is never treated as a client name.
- Otherwise, a single token that is a valid IP address is a client IP filter, and any other single token that is a valid hostname is a client name filter.
- The keyword `domain` (case-insensitive) followed by exactly one token is a domain filter. A client literally named `domain` therefore cannot be filtered by name. Use its IP instead.
- Domains are lowercased, and a single trailing dot is stripped (`example.com.` becomes `example.com`). Hostnames are passed through as typed.
- Valid names match `[A-Za-z0-9_][A-Za-z0-9_.-]{0,252}`. Anything else is rejected before it reaches the API.
- IPv6 zone IDs (`fe80::1%eth0`) are rejected, even though `isIP` accepts them.

Reply format reuses the existing layout. When a filter is active, the title names it:

```
🚫 Recently blocked · domain ads.example.com
1. ads.example.com — 2 minutes ago · laptop (192.168.1.10)
2. ads.example.com — 5 minutes ago · 192.168.1.20
```

```
🚫 Recently blocked · client 192.168.1.5
1. tracker.example.net — 1 minute ago · my-phone (192.168.1.5)
```

Empty result: `No blocked queries for client 192.168.1.5` (or `domain ...`). Plain `/recent` keeps `No blocked queries yet`.

Invalid input:

```
❌ Invalid filter. Send /recent, /recent <client IP or hostname>, or /recent domain <domain>, e.g. /recent 192.168.1.5 or /recent domain ads.example.com.
```

The filter value is user input, so it is HTML-escaped and truncated like other labels. This applies everywhere it appears: inside the bold title and in the filtered empty message, both of which are sent with `parse_mode: "HTML"`.

## Technical approach

Follows the layering in `docs/agent-guides/architecture.md`.

- **Parsing:** new `src/helpers/recentFilter.js` exporting `parseRecentFilter(payload)`. It returns `{ type: "all" }`, `{ type: "client", param: "client_ip" | "client_name", value }`, `{ type: "domain", param: "domain", value }`, or `null` for invalid input. IP detection uses `node:net` `isIP`.
- **Service:** `getRecentBlocked({ param, value } = undefined)` in `src/services/piholeService.js` builds the query with `URLSearchParams` in the order `upstream=blocklist`, `length`, then the filter parameter, so values are URL-encoded. The service does not know about the parser's result shape. With no filter the path is identical to today's.
- **Controller:** `recentController` parses `ctx.payload`, replies with the usage message on `null`, otherwise maps the parsed filter to `{ param, value }` (or nothing for `all`), calls the service and renders. It stays thin, and failures propagate to the central error handler.
- **Formatting:** `renderRecent(entries, nowMs, filter)` in `src/helpers/recentFormat.js`, where `filter` is the parsed filter object (`{ type, value }`) or undefined. It builds the label `client <value>` or `domain <value>`, escapes and truncates the value, and adds it to the title (inside the `<b>`) and to the empty message. The optional third argument keeps existing callers working.
- **Command registry:** update the `recent` description in `src/constants/commands.js` (it feeds the Telegram command menu), e.g. "Show recently blocked domains, optionally for one client or domain".
- **Pi-hole API:** `GET /api/queries` filter parameters `client_ip`, `client_name` and `domain`, combined with the existing `upstream=blocklist`.

### Pre-implementation checklist (verify with `curl` on the target Pi-hole v6)

Record the findings in this spec before coding.

Verified by the owner on Pi-hole v6 before implementation.

- [x] `client_ip`, `client_name` and `domain` each combine with `upstream=blocklist`.
- [x] `length` is applied after filtering, not before. Otherwise filtered results would be mostly empty.
- [x] `client_name` is an exact match and matches the hostname Pi-hole displays.
- [x] What `upstream=blocklist` covers: only list (gravity) blocks, or also regex and exact-deny blocks. If it misses some, `/recent domain x` can report no blocks for a domain that is blocked, and the empty message and risks below need updating.
- **Parsing of responses:** `parseRecentBlocked` is unchanged.

No new constants or error types are needed. The usage message lives in the controller, as in `pauseController`.

## Acceptance criteria

- `/recent` output and API path are byte-for-byte unchanged.
- `/recent <IPv4>`, `/recent <IPv6>`, `/recent <hostname>` and `/recent domain <domain>` call the API with the matching parameter and render a labelled list.
- `/rc` accepts the same arguments.
- Invalid input replies with the usage message and makes no Pi-hole request.
- Special characters in the filter cannot alter the request (no extra query parameters) or the HTML reply.
- An empty filtered result renders the filtered empty message.
- The `recent` description in `src/constants/commands.js` mentions the filters.
- Whitespace-only payloads behave as plain `/recent`.
- Tests, matching the existing suites:
  - `recentFilter` parser: all, whitespace-only, IP, IPv6, IPv6 zone ID rejected, hostname, domain, bare `domain` rejected, case handling, trailing dot, rejections.
  - `recentFormat`: filtered title, escaping in title and empty message, filtered empty state, unfiltered output unchanged.
  - `piholeService`: each filter's request path, unfiltered path unchanged (parameter order pinned).
  - `commandFlows`: filtered call through `/recent` and `/rc`, invalid filter makes no service call.
- README usage section documents the new arguments.
- `npm run check` and `npm test` pass.

## Risks and open questions

- **Hostname matching:** Pi-hole may match `client_name` exactly or only against names it has resolved. If a name returns nothing while the IP works, the empty message could mislead. Mitigation: verify on a real Pi-hole and mention IP as the fallback in the empty message if needed.
- **Blocked-only results:** `/recent domain x` returning nothing means "not blocked recently", not "not queried". The empty message says "blocked" explicitly. Whether to include allowed queries is an open product question, tracked as a non-goal above.
- **Blocked coverage:** `upstream=blocklist` may not include every kind of block (see the pre-implementation checklist). Until verified, "no blocked queries" is only as complete as that filter.
- **Reserved word:** `domain` as a client name is not filterable by name, as noted under UX.

## Suggested branch

`feat/recent-filters`

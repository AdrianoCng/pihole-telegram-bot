# Architecture and error handling

## Layout

- `index.js` is the entrypoint. It validates configuration, builds the bot, registers Telegram autocomplete, launches, and ends the Pi-hole session on shutdown.
- `src/app/` wires the bot: `createBot.js`, the ordered command list in `commands.js`, registry mechanics in `registry.js`, and middleware (authentication, typing indicator, central error handler).
- `src/features/<name>/` holds one area of user-facing behavior: its command definitions and handlers (`command.js`), Pi-hole or host operations (`service.js`), and any parsing (`parse.js`), formatting (`format.js`) and constants it owns, with tests in `__tests__/`.
- `src/pihole/` talks to Pi-hole: the HTTP client, the session (single-flight re-authentication and one retry after a 401), the CLI runner, and API endpoints.
- `src/shared/` holds code used by more than one feature: error types and classification, the command executor, Telegram reply and HTML helpers, number and time formatting, payload validators, safe logging, and timeouts.
- `src/config.js` reads environment variables. Required ones are validated at startup.

## Dependency rules

- `app` may import from `features`, `pihole` and `shared`. A feature imports only from `pihole` and `shared`, never from `app` or another feature. `pihole` and `shared` never import from `app` or `features`.
- When two features need the same code, move it to `shared/`.
- Use named exports only.

## Adding a command

1. Create `src/features/<name>/` with a `command.js` that exports a definition: `{ trigger, description, handler, showInKeyboard? }`. `trigger` is a string or an array of aliases, and the first alias is the canonical name. Put inline keyboard callbacks in a separate definition with a pattern `trigger`.
2. Put Pi-hole or host calls in `service.js` and keep the handler focused on parsing input, delegating, and replying.
3. Add the definition to `COMMANDS` (or `ACTIONS`) in `src/app/commands.js` at the position it should have in the menu and `/help`.

## Error handling

- Handlers await their replies and let failures propagate. `src/app/middleware/errorHandler.js` is the single error boundary: it logs safely, replies with a fixed message for the error's kind, and never rethrows.
- Throw `PiholeError` for Pi-hole HTTP and payload failures and `CommandError` for nonzero host command exits. Keep error messages static because errors are logged in full.

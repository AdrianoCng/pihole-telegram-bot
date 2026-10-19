# Architecture and error handling

## Layout

- `index.js` is the entrypoint. It validates configuration, builds the bot, registers Telegram autocomplete, launches, and ends the Pi-hole session on shutdown.
- `src/app/` wires the bot: `createBot.js`, the ordered command list in `commands.js`, registry mechanics in `registry.js`, and middleware (authentication, typing indicator, central error handler).
- `src/features/<name>/` holds one area of user-facing behavior: its command definitions and thin handlers (`command.js`), and the logic including Pi-hole or host operations (`service.js`), and any parsing (`parse.js`), formatting (`format.js`) and constants it owns, with tests in `__tests__/`.
- `src/pihole/` talks to Pi-hole: the HTTP client, the session (single-flight re-authentication and one retry after a 401), the CLI runner, and API endpoints.
- `src/shared/` holds code used by more than one feature, plus cross-cutting code: error classes (`errors/`), `validators.js`, `logError.js`, and Telegram and formatting helpers.
- `src/config.js` validates every environment variable with envalid when first imported and exports the immutable `env`. Read configuration from `env`, never from `process.env`.

## Dependency rules

- `app` may import from `features`, `pihole` and `shared`. A feature imports only from `pihole` and `shared`, never from `app` or another feature. `pihole` and `shared` never import from `app` or `features`.
- When two features need the same code, move it to `shared/`.
- Use named exports only.

## Adding a command

1. Create `src/features/<name>/` with a `command.js` that exports a definition: `{ trigger, description, handler, showInKeyboard? }`. `trigger` is a string or an array of aliases, and the first alias is the canonical name. Put inline keyboard callbacks in a separate definition with a pattern `trigger`.
2. Put all logic, including Pi-hole or host calls, in `service.js`. Keep the handler limited to Telegram replies and delegation to the service.
3. Add the definition to `COMMANDS` (or `ACTIONS`) in `src/app/commands.js` at the position it should have in the menu and `/help`.

## Error handling

- Handlers await their replies and let failures propagate. `src/app/middleware/errorHandler.js` is the single error boundary: it logs through `logError`, replies with a fixed message for the error's kind, and never rethrows.
- Every error thrown on purpose extends the abstract `AppError` (`src/shared/errors/AppError.js`). Anything else reaching the boundary is treated as a bug and gets a generic reply.
- Throw the narrowest existing subclass from `src/shared/errors/` (`ApiError` and `CommandError` families; use `invalidResponse()` from `src/shared/validators.js` for invalid Pi-hole payloads). If none fits, add one that extends `AppError` or the closest family class, with its own `userMessage` and a test.
- Each class owns its Telegram reply through the `userMessage` getter and its DEBUG output through `debugFields()`. Add a field to `debugFields()` only if it can never hold a secret, header, session ID, or payload.
- Wrap a lower-level failure with `cause` instead of rethrowing it. With `DEBUG=true`, the reply lists the cause chain.
- Keep error messages static because errors are logged in full.

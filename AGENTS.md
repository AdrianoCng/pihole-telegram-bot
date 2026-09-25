## Project Overview

A Telegram bot for remotely controlling Pi-hole on a Raspberry Pi. Built with Node.js, Telegraf, and ES modules, using grouped controllers and application services.

## Commands

- `npm run dev` — development with nodemon
- `npm start` — production start
- `npm run start:prod` — production with PM2
- `npm test` — full Jest suite
- `npm run test:coverage` — coverage with 80% thresholds
- Single suite: `npx jest src/controllers/__tests__/apiController.test.js`

## Architecture

**Entrypoint** (`index.js`): Loads dotenv before importing the bot, publishes Telegram autocomplete commands, launches the bot even if publication fails, and installs graceful shutdown handlers. On shutdown it ends any Pi-hole API session best-effort (1-second timeout) before stopping the bot.

**Bot** (`src/bot.js`): Exports a configured Telegraf instance. Registers authentication, typing, commands, greetings, help, fallback replies, and error handling. Importing it does not launch the bot.

**Command registry** (`src/constants/commands.js`): Single source for triggers, aliases, descriptions, handlers, and keyboard visibility. To add a command, add its controller handler and a registry entry. The registry drives command registration, help, keyboard, and Telegram autocomplete.

**Controllers** (`src/controllers/`):
- `apiController.js`: adapts authorization, logout, and Pi-hole message results for Telegram
- `cliController.js`: delegates host and Pi-hole operations, then adapts streamed output for Telegram
- `botController.js`: bot version and menu
- `summaryController.js`: renders the `/summary` dashboard and maps every failure to a fixed user-facing message; it never rethrows to `bot.catch`

Controllers export named function declarations and a default object. The registry uses named exports through namespace imports so the menu/registry import cycle is safe in native ESM. Controllers may use Telegraf contexts, but services must not. Construct the keyboard only when requested, never during controller module initialization.

**Services** (`src/services/`):
- `piholeService.js`: owns Pi-hole authorization, sessions, messages, the summary dashboard, and semantic Pi-hole operations
- `piholeSession.js`: internal to the service layer (controllers never import it). Owns the session lifecycle, automatic sign-in, the single retry after `401`, sharing of concurrent refreshes, and per-request timeouts
- `systemService.js`: owns reboot and the sequential host-upgrade workflow

Services implement application use cases. They return data or accept transport-neutral output callbacks; they never receive a Telegraf context or send Telegram messages directly.

**API model** (`src/api.js`): Shared Pi-hole HTTP client with session operations (`hasSession`, `setSession`, `clearSession`), optional abort signals, JSON requests, response parsing, and HTTP error mapping. The base URL is initialized at import time. It holds no credentials and does not authenticate on its own.

**Errors** (`src/errors/`): `PiholeError` has a `code` (`HTTP`, `INVALID_SESSION`, `INVALID_RESPONSE`) and, for HTTP errors, a `status`. Messages must be static strings, because `bot.catch` logs raw errors.

**Helpers** (`src/helpers/`):
- `config.js`: `getEnv(key)` reads configuration and throws for undefined values
- `sendMessage.js`: emoji replacement and `ctx.reply()`, forwarding options and return value
- `execCommandWithOutput.js`: spawns sudo commands, streams output through a callback, rejects on nonzero exit
- `spawnPiholeCommand.js`: delegates to the execution helper with command `pihole`
- `botCommands.js`: validates triggers and registers handlers
- `keyboard.js`: builds the two-column keyboard from the registry
- `summaryParsers.js`: strict validation of the Pi-hole summary, blocking-state, and message-count responses
- `summaryFormat.js`: pure formatting and rendering of the dashboard (`en-GB` counts, injected clock)
- `logSafeError.js`: logs an allowlist of fields only; never headers, SIDs, passwords, or payloads

The summary helpers and the safe logger are imported directly and are not re-exported from `index.js`.
- `index.js`: helper exports

**Middleware** (`src/middlewares/`): Directly imported authentication and typing functions.

Data flows:
- API: User → Bot → Controller → Pi-hole service → shared API client → Pi-hole
- CLI: User → Bot → Controller → Pi-hole/System service → execution helper → sudo
- Summary: User → Bot → summaryController → piholeService.getSummary → piholeSession (sign-in, three concurrent reads, one retry after 401, 5-second deadline) → shared API client → Pi-hole
- Presentation: Services return data or output events → Controller → message helper → User

## Environment Variables

Required in `.env` (see `.env.example`):
- `BOT_TOKEN` — Telegram bot token
- `PIHOLE_PASSWORD` — Pi-hole admin password
- `PIHOLE_IP` — Pi-hole URL
- `ALLOWED_USER` — authorized Telegram user ID

Missing values fail when read: IP and token at initialization, password on authorization, and allowed user during authentication. Empty strings retain their existing behavior.

## Testing

- Jest with Babel transpiles ESM; the Babel configuration preserves module-relative `import.meta.url` values.
- Tests live in colocated `__tests__/` directories and use module mocks for imported dependencies.
- Shared utilities and fixed, non-secret initialization fixtures live in `src/__tests__/helpers/`.
- Isolate environment variables, fetch mocks, and shared API headers between tests.
- Startup tests mock external boundaries; native ESM subprocess checks verify import ordering and version lookup outside the repository.
- Coverage excludes bot wiring, helper re-exports, test utilities, and typing middleware. Bot wiring has separate behavioral tests.
- Never run actual reboot, upgrade, Pi-hole, or Telegram operations in tests.

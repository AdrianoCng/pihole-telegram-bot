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

**Entrypoint** (`index.js`): Loads dotenv before importing the bot, publishes Telegram autocomplete commands, launches the bot even if publication fails, and installs graceful shutdown handlers that end any Pi-hole API session (best-effort, 1 s timeout) before stopping the bot.

**Bot** (`src/bot.js`): Exports a configured Telegraf instance. Registers authentication, typing, commands, greetings, help, fallback replies, and error handling. Importing it does not launch the bot.

**Command registry** (`src/constants/commands.js`): Single source for triggers, aliases, descriptions, handlers, and keyboard visibility. To add a command, add its controller handler and a registry entry. The registry drives command registration, help, keyboard, and Telegram autocomplete.

**Controllers** (`src/controllers/`):
- `apiController.js`: adapts authorization, logout, and Pi-hole message results for Telegram
- `cliController.js`: delegates host and Pi-hole operations, then adapts streamed output for Telegram
- `botController.js`: bot version and menu
- `summaryController.js`: renders the `/summary` dashboard and maps failures to fixed user-facing messages; catches its own errors so nothing reaches `bot.catch`

Controllers export named function declarations and a default object. The registry uses named exports through namespace imports so the menu/registry import cycle is safe in native ESM. Controllers may use Telegraf contexts, but services must not. Construct the keyboard only when requested, never during controller module initialization.

**Services** (`src/services/`):
- `piholeService.js`: owns Pi-hole authorization, sessions, messages, the summary dashboard (`getSummary()`: concurrent reads, validation, partial-failure policy), and semantic Pi-hole operations
- `piholeSession.js`: internal to services (controllers never import it). Owns the SID lifecycle: transparent authentication, exactly one retry after `401`, a shared in-flight refresh with a generation counter, and per-request timeouts combined with the caller's deadline signal
- `systemService.js`: owns reboot and the sequential host-upgrade workflow

Services implement application use cases. They return data or accept transport-neutral output callbacks; they never receive a Telegraf context or send Telegram messages directly.

**API model** (`src/api.js`): Shared Pi-hole HTTP client with session headers (`hasSession`, `setSession`, `clearSession`), optional `{ signal }` on every request, JSON requests, response parsing, and `ApiError` mapping. The base URL is initialized at import time. No credentials, retries, or validation here.

**Errors** (`src/errors/`): Error classes, each imported directly by its consumers.
- `ApiError.js`: non-2xx HTTP responses, with `status` and `isApiError`
- `PiholeError.js`: Pi-hole domain failures with a `code` (`INVALID_SESSION`, `INVALID_RESPONSE`) and static messages only, so errors are always safe to log

**Helpers** (`src/helpers/`):
- `config.js`: `getEnv(key)` reads configuration and throws for undefined values
- `sendMessage.js`: emoji replacement and `ctx.reply()`, forwarding options and return value
- `execCommandWithOutput.js`: spawns sudo commands, streams output through a callback, rejects on nonzero exit
- `spawnPiholeCommand.js`: delegates to the execution helper with command `pihole`
- `botCommands.js`: validates triggers and registers handlers
- `keyboard.js`: builds the two-column keyboard from the registry
- `summaryParsers.js`: strict validation of Pi-hole summary, blocking-state, and message-count payloads (no coercion or defaults)
- `summaryFormat.js`: pure dashboard formatting (`en-GB` counts, percentages, gravity age from an injected `nowMs`)
- `logSafeError.js`: allowlist-only failure logging; never logs headers, SIDs, passwords, payloads, or raw errors
- `index.js`: helper exports (the summary helpers and `logSafeError` are imported directly, not re-exported)

**Middleware** (`src/middlewares/`): Directly imported authentication and typing functions.

Data flows:
- API: User → Bot → Controller → Pi-hole service → shared API client → Pi-hole
- CLI: User → Bot → Controller → Pi-hole/System service → execution helper → sudo
- Summary: User → Bot → `summaryController` → `piholeService.getSummary()` → `piholeSession` (auth, then `/stats/summary`, `/dns/blocking`, `/info/messages/count` concurrently under a 5 s command deadline) → parsers → domain model → `renderSummary` → User
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

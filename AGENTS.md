## Project Overview

A Telegram bot for remotely controlling Pi-hole on a Raspberry Pi. Built with Node.js, Telegraf, and ES modules, using grouped controllers and directly imported function helpers.

## Commands

- `npm run dev` — development with nodemon
- `npm start` — production start
- `npm run start:prod` — production with PM2
- `npm test` — full Jest suite
- `npm run test:coverage` — coverage with 80% thresholds
- Single suite: `npx jest src/controllers/__tests__/apiController.test.js`

## Architecture

**Entrypoint** (`index.js`): Loads dotenv before importing the bot, publishes Telegram autocomplete commands, launches the bot even if publication fails, and installs graceful shutdown handlers.

**Bot** (`src/bot.js`): Exports a configured Telegraf instance. Registers authentication, typing, commands, greetings, help, fallback replies, and error handling. Importing it does not launch the bot.

**Command registry** (`src/constants/commands.js`): Single source for triggers, aliases, descriptions, handlers, and keyboard visibility. To add a command, add its controller handler and a registry entry. The registry drives command registration, help, keyboard, and Telegram autocomplete.

**Controllers** (`src/controllers/`):
- `apiController.js`: authorization, logout, and Pi-hole messages
- `cliController.js`: Pi-hole CLI operations, reboot, and sequential host upgrades
- `botController.js`: bot version and menu

Controllers export named function declarations and a default object. The registry uses named exports through namespace imports so the menu/registry import cycle is safe in native ESM. Construct the keyboard only when requested, never during controller module initialization.

**API model** (`src/api.js`): Shared Pi-hole HTTP client with session headers, JSON requests, response parsing, and `ApiError` mapping. The base URL is initialized at import time.

**Helpers** (`src/helpers/`):
- `config.js`: `getEnv(key)` reads configuration and throws for undefined values
- `sendMessage.js`: emoji replacement and `ctx.reply()`, forwarding options and return value
- `execCommandWithOutput.js`: spawns sudo commands, streams output, rejects on nonzero exit
- `spawnPiholeCommand.js`: delegates to the execution helper with command `pihole`
- `botCommands.js`: validates triggers and registers handlers
- `keyboard.js`: builds the two-column keyboard from the registry
- `index.js`: helper exports

**Middleware** (`src/middlewares/`): Directly imported authentication and typing functions.

Data flows:
- API: User → Bot → Controller → shared API client → Pi-hole → message helper → User
- CLI: User → Bot → Controller → execution helper → sudo → message helper → User

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

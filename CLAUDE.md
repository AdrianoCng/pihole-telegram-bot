# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Telegram bot for remotely controlling Pi-hole (network ad blocker) on a Raspberry Pi. Built with Node.js, Telegraf, and ES modules. Follows SOLID principles with dependency injection.

## Commands

- `npm run dev` — development mode with nodemon auto-reload
- `npm start` — production start (`node index.js`)
- `npm run start:prod` — production with PM2 process manager
- `npm test` — run full Jest test suite
- `npm run test:coverage` — run tests with coverage report (80% threshold enforced)
- Run a single test: `npx jest src/commands/__tests__/apiCommands.test.js`

## Architecture

**Composition root** (`index.js`): Loads env vars, creates all services via DI container, wires dependencies, and launches the bot. This is the only file that knows about the container or reads `process.env`.

**Contracts** (`src/contracts/index.js`): JSDoc `@typedef` definitions for `HttpClient`, `MessageSender`, `CommandExecutor`, `PiholeExecutor`, `Config`, and `CommandDefinition`. No runtime code — used for documentation and IDE autocomplete.

**Services** (`src/services/`): Implementations of contracts, each with a single responsibility:
- `Config.js` — wraps `process.env`, provides `get(key)` with missing-key validation
- `PiholeApiClient.js` — HTTP client for Pi-hole REST API (`get/post/delete/setHeader`)
- `MessageSender.js` — emoji replacement + Telegraf `ctx.reply()` wrapper
- `CommandExecutor.js` — spawns shell commands with `sudo`, streams output via MessageSender
- `PiholeCommandExecutor.js` — thin wrapper: delegates to CommandExecutor with `command = "pihole"`

**Commands** (`src/commands/`): One file per command, each exporting a factory function that receives its dependencies and returns a `CommandDefinition` object (`{trigger, description, handler, showInKeyboard?}`).
- Adding a new command: create a new file in `src/commands/`, add one import + one array entry in `src/commands/index.js`
- API commands (authorize, logout, messages) depend on `httpClient`, `messageSender`, `config`
- CLI commands (status, enable, disable, version, update, upgravity) depend on `piholeExecutor`
- System commands (reboot, upgrade) depend on `commandExecutor`
- Bot commands (botVersion, menu) depend on `messageSender`

**Bot factory** (`src/bot.js`): `createBot(deps)` receives all dependencies, sets up Telegraf middlewares, registers commands, and returns the bot instance.

**Middleware** (`src/middlewares/`):
- `authenticate.js` — factory: `createAuthMiddleware({config, messageSender})` → checks authorized user
- `typing.js` — stateless Telegraf typing indicator (unchanged)

**UI** (`src/ui/keyboard.js`): `getMainMenu(commands)` — generates keyboard from command array.

**DI Container** (`src/container.js`): Hand-rolled, ~15 lines. `register(name, factory)` + `resolve(name)` with lazy singleton caching. Only used in the composition root.

**Key data flows:**
- API commands: User → Bot → HttpClient → Pi-hole REST API → MessageSender → User
- CLI commands: User → Bot → PiholeExecutor → CommandExecutor → `spawn('sudo', ['pihole', ...])` → MessageSender → User

## Environment Variables

Required in `.env` (see `.env.example`):
- `BOT_TOKEN` — Telegram bot token from @BotFather
- `PIHOLE_PASSWORD` — Pi-hole admin password
- `PIHOLE_IP` — Pi-hole URL (e.g., `http://192.168.1.100`)
- `ALLOWED_USER` — authorized Telegram user ID

## Testing

- Jest with babel (babel.config.cjs transpiles ESM for Jest)
- Tests live in `__tests__/` directories alongside source
- All tests use direct dependency injection — no `jest.mock` for service dependencies
- Shared test utilities in `src/__tests__/helpers/testUtils.js` — provides `createMockContext()`, `mockApiResponse()`, `testApiMethodErrors()`, `createMockProcess()`, `setupApiMocks()`
- Coverage excludes: `bot.js`, `contracts/`, test utilities, `typing.js`

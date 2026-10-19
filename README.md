# Pihole Telegram Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue)](https://core.telegram.org/bots)
[![Pi-hole](https://img.shields.io/badge/Pi--hole-Integration-red)](https://pi-hole.net/)

A Telegram bot to remotely control and monitor your Pi-hole setup from anywhere.

## 📑 Table of Contents

- [✨ Features](#-features)
- [📋 Prerequisites](#-prerequisites)
- [🛠️ Installation](#️-installation)
- [🚀 Running the Bot](#-running-the-bot)
- [📱 Usage](#-usage)
- [🧪 Testing](#-testing)
- [🔐 Security](#-security)
- [📄 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)

## ✨ Features

- 📈 Pi-hole health and activity dashboard
- 🚫 Enable/disable Pi-hole blocking
- ⏸ Pause blocking temporarily (10 sec, 30 sec, 5 min, or a custom time)
- 📊 Monitor Pi-hole status and view system messages
- 🔍 Check Pi-hole version information
- 🔄 Update Pi-hole subsystems and blocklists
- 🔒 Secure access limited to authorized users
- 🔌 Reboot Raspberry Pi remotely

## 📋 Prerequisites

- Raspberry Pi with Pi-hole installed
- Telegram account
- Node.js and npm installed on your Raspberry Pi - Installation instructions [here](https://nodesource.com/products/distributions)

## 🛠️ Installation

1. Clone this repository to your Raspberry Pi:

   ```bash
   git clone https://github.com/AdrianoCng/pihole-telegram-bot.git
   cd pihole-telegram-bot
   ```

2. Install dependencies on your Raspberry Pi:

   ```bash
   npm install
   ```

3. Create a Telegram bot:

   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` and follow the instructions
   - Copy the bot token provided by BotFather

4. Get your Telegram user ID:

   - Search for [@userinfobot](https://t.me/userinfobot) on Telegram
   - Start a conversation and it will display your ID

5. Create a `.env` file in the project directory on your Raspberry Pi with the following variables:

   ```
   BOT_TOKEN=your_telegram_bot_token_here
   PIHOLE_PASSWORD=your_pihole_admin_password_here
   PIHOLE_URL=your_pihole_url_here
   ALLOWED_USER=your_telegram_user_id_here
   DEBUG=false
   ```

   All variables except `DEBUG` are required. If any are missing or invalid, the bot exits at startup and lists them.

   `DEBUG` is optional and defaults to `false`. It accepts `true`/`false`, `1`/`0`, `yes`/`no` and `on`/`off`. When enabled, error replies in Telegram also include the underlying error details, and the full error (message, stack, cause) is written to the console log. Keep it off in normal use, as details may reveal internal URLs or paths.

   Example:

   ```
   BOT_TOKEN="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
   PIHOLE_PASSWORD="YourPiholePasswordHere"
   PIHOLE_URL="http://192.168.1.100"
   ALLOWED_USER="123456789"
   ```

## 🚀 Running the Bot

> **NOTE:** These commands must be run on your Raspberry Pi.

### Manual Start

```bash
node index.js
```

Or using npm:

```bash
npm start
```

### Using PM2 (Recommended)

1. Install PM2 globally on your Raspberry Pi:

   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2 on your Raspberry Pi:

   ```bash
   pm2 start index.js --name pi-hole-telegram-bot
   ```

   Or using npm:

   ```bash
   npm run start:prod
   ```

3. Configure PM2 to start on boot (on your Raspberry Pi):
   ```bash
   pm2 startup
   pm2 save
   ```

## 📱 Usage

1. Start a conversation with your bot on Telegram (from any device)
2. Use the available commands to control your Pi-hole:
   - `/summary` or `/stats` - Show Pi-hole health and activity summary
   - `/top` or `/t` - Show the top 10 blocked domains and top 5 clients
   - `/recent` or `/rc` - Show the 10 most recently blocked domains, with when and which client asked for them. Add a client IP or hostname to filter by client, or `domain <domain>` to filter by exact domain. Use `*` as a wildcard, e.g. `/recent 192.168.1.*`, `/recent *phone*` or `/recent domain *.example.com`. In a filter containing `*`, `_` also matches any single character, so `/recent my_phone*` can match `myXphone-1`
   - `/status` or `/s` - Display the running status of Pi-hole subsystems
   - `/messages` or `/m` - Show messages from Pi-hole
   - `/authorize` or `/a` - Authorize the bot
   - `/logout` or `/logoff` - Logout the bot
   - `/enable` or `/e` - Enable Pi-hole subsystems
   - `/disable` or `/d` - Disable Pi-hole subsystems
   - `/pause` or `/p` - Temporarily disable blocking. Pick a preset (10 sec, 30 sec, 5 min) or send a custom time, e.g. `/pause 90s`, `/pause 15m`, `/pause 1h` (max 24h)
   - `/allow <domain>` - Add a domain to the allowlist. Use `*.domain` to also allow every subdomain, e.g. `/allow *.example.com` (stored as a regex entry, like the web interface's wildcard option)
   - `/deny <domain>` - Add a domain to the denylist. Use `*.domain` to also block every subdomain, e.g. `/deny *.ads.example`
   - `/unallow <domain>` - Remove a domain from the allowlist. Use `*.domain` to remove a wildcard added with `/allow *.domain`
   - `/undeny <domain>` - Remove a domain from the denylist, e.g. `/undeny example.com` or `/undeny *.ads.example`
   - `/domains` - List allowlist and denylist entries, both exact and regex
   - `/version` or `/v` - Show installed version of Pi-hole, Web Interface & FTL
   - `/update` or `/up` - Update Pi-hole subsystems
   - `/upgravity` or `/g` - Update the list of ad-serving domains
   - `/reboot` or `/r` - Reboot the Raspberry Pi
   - `/upgrade` or `/upg` - Upgrade host system
   - `/bot` or `/bv` - Show the version of the bot
   - `/help` - Show available commands and descriptions

The reply keyboard lists read-only monitoring commands first (`/summary`, `/top`, `/recent`, `/status`, `/messages`), followed by session commands and then maintenance and destructive commands.

### API authentication

`/summary`, `/top`, `/recent`, `/messages`, `/allow`, `/deny`, `/unallow`, `/undeny` and `/domains` sign in to the Pi-hole API automatically using `PIHOLE_PASSWORD`, and sign in again once if the session has expired. You no longer need to run `/authorize` after restarting the bot. `/authorize` and `/logout` remain available for manual troubleshooting. On a graceful shutdown (`SIGINT`/`SIGTERM`, including PM2 restarts) the bot ends its Pi-hole API session so that restarts do not use up Pi-hole's session limit.

## 🧪 Testing

Development and testing use Vitest and require Node 22.12+ on the 22.x line or Node 24.x. CI runs on Node 22.

```bash
npm ci --include=dev
npm test                                         # Run the full suite once
npm run test:watch                               # Rerun tests on changes
npm test -- src/pihole/__tests__/client.test.js  # Run one suite
npm run test:coverage                            # Generate V8 coverage reports
```

Tests mock Telegram, HTTP, and system command effects. They use fixed initialization fixtures and do not require a local `.env` file. Import test APIs and `vi` explicitly from `vitest`.

Coverage is informational, with no pass/fail percentage threshold. Reports are written to `coverage/`, including an HTML report at `coverage/lcov-report/index.html`.

## 🔐 Security

This bot restricts access to the authorized Telegram user ID specified in the `.env` file.
Only user with ID listed in `ALLOWED_USER` can interact with the bot.

## 📄 License

MIT

## 🙏 Acknowledgements

- [Pi-hole](https://pi-hole.net/) - Network-wide ad blocking
- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework for Node.js

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
- [🔐 Security](#-security)
- [📄 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)

## ✨ Features

- 📈 Pi-hole health and activity dashboard
- 🚫 Enable/disable Pi-hole blocking
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
   PIHOLE_IP=your_pihole_ip_address_here
   ALLOWED_USER=your_telegram_user_id_here
   ```

   Example:

   ```
   BOT_TOKEN="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
   PIHOLE_PASSWORD="YourPiholePasswordHere"
   PIHOLE_IP="http://192.168.1.100"
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
   - `/status` or `/s` - Display the running status of Pi-hole subsystems
   - `/messages` or `/m` - Show messages from Pi-hole
   - `/authorize` or `/a` - Authorize the bot
   - `/logout` or `/logoff` - Logout the bot
   - `/enable` or `/e` - Enable Pi-hole subsystems
   - `/disable` or `/d` - Disable Pi-hole subsystems
   - `/version` or `/v` - Show installed version of Pi-hole, Web Interface & FTL
   - `/update` or `/up` - Update Pi-hole subsystems
   - `/upgravity` or `/g` - Update the list of ad-serving domains
   - `/reboot` or `/r` - Reboot the Raspberry Pi
   - `/upgrade` or `/upg` - Upgrade host system
   - `/bot` or `/bv` - Show the version of the bot
   - `/help` - Show available commands and descriptions

The reply keyboard lists read-only monitoring commands first (`/summary`, `/status`, `/messages`), followed by session commands and then maintenance and destructive commands.

### Summary dashboard

`/summary` replies with a single message such as:

```text
🟢 Pi-hole is active

Queries: 52,491
Blocked: 8,643 (16.5%)
Cached: 17,952 (34.2%)
Forwarded: 25,896
Active clients: 23
Gravity domains: 1,234,567
Gravity updated: 2 hours ago

⚠️ Pi-hole messages: 1
```

The status line is red when blocking is disabled and orange when the blocking state cannot be determined. The message-count line appears only when Pi-hole has messages.

### API authentication

`/summary` and `/messages` sign in to the Pi-hole API automatically using `PIHOLE_PASSWORD`, and sign in again once if the session has expired. You no longer need to run `/authorize` after restarting the bot. `/authorize` and `/logout` remain available for manual troubleshooting. On a graceful shutdown (`SIGINT`/`SIGTERM`, including PM2 restarts) the bot ends its Pi-hole API session so that restarts do not use up Pi-hole's session limit.

## 🔐 Security

This bot restricts access to the authorized Telegram user ID specified in the `.env` file.
Only user with ID listed in `ALLOWED_USER` can interact with the bot.

## 📄 License

MIT

## 🙏 Acknowledgements

- [Pi-hole](https://pi-hole.net/) - Network-wide ad blocking
- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework for Node.js

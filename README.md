# Pi-hole Telegram Bot

A Telegram bot to remotely control and monitor your Pi-hole setup from anywhere.

## ✨ Features

- 🔐 User authentication
- 🚫 Enable/disable Pi-hole blocking
- 📊 Monitor Pi-hole status and view system messages
- 🔍 Check Pi-hole version information
- 🔄 Update Pi-hole subsystems and blocklists
- 🔒 Secure access limited to authorized users

## 📋 Prerequisites

- Raspberry Pi with Pi-hole installed
- Telegram account
- Node.js and npm installed on your Raspberry Pi

## 🛠️ Installation

1. Clone this repository to your Raspberry Pi:

   ```bash
   git clone https://github.com/AdrianoCng/pi-hole-telegram-bot.git
   cd pi-hole-telegram-bot
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

### Using PM2 (Recommended)

1. Install PM2 globally on your Raspberry Pi:

   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2 on your Raspberry Pi:

   ```bash
   pm2 start index.js --name pi-hole-telegram-bot
   ```

3. Configure PM2 to start on boot (on your Raspberry Pi):
   ```bash
   pm2 startup
   pm2 save
   ```

## 📱 Usage

1. Start a conversation with your bot on Telegram (from any device)
2. Use the available commands to control your Pi-hole:
   - `/authorize` or `/a` - Authorize the bot
   - `/logout` or `/logoff` - Logout the bot
   - `/messages` or `/m` - Show messages from Pi-hole
   - `/status` or `/s` - Display the running status of Pi-hole subsystems
   - `/enable` or `/e` - Enable Pi-hole subsystems
   - `/disable` or `/d` - Disable Pi-hole subsystems
   - `/version` or `/v` - Show installed version of Pi-hole, Web Interface & FTL
   - `/update` or `/up` - Update Pi-hole subsystems
   - `/upgravity` or `/g` - Update the list of ad-serving domains
   - `/help` - Show available commands and descriptions

## 🔐 Security

This bot restricts access to the authorized Telegram user ID specified in the `.env` file.
Only user with ID listed in `ALLOWED_USER` can interact with the bot.

## 📄 License

MIT

## 🙏 Acknowledgements

- [Pi-hole](https://pi-hole.net/) - Network-wide ad blocking
- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework for Node.js

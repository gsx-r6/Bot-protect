# UHQ Monde - Discord Bot

## Overview
A Discord moderation and security bot built with discord.js. The bot provides extensive moderation commands, auto-moderation features, security protections, and server management utilities.

## Project Structure
```
├── src/
│   ├── commands/          # Slash commands organized by category
│   │   ├── administration/  # Server configuration commands
│   │   ├── information/     # Info commands (avatar, banner, etc.)
│   │   ├── logging/         # Log configuration commands
│   │   ├── moderation/      # Ban, kick, warn, mute, etc.
│   │   ├── owner/           # Bot owner commands
│   │   ├── security/        # Anti-raid, anti-spam, etc.
│   │   ├── staff/           # Staff management commands
│   │   ├── system/          # Bot system commands
│   │   └── utility/         # General utility commands
│   ├── config/            # Configuration files
│   ├── core/              # Bot core (client, env loader)
│   ├── database/          # SQLite database handler
│   ├── events/            # Discord event handlers
│   ├── handlers/          # Command/event/permission handlers
│   ├── jobs/              # Scheduled tasks
│   ├── security/          # Security modules
│   ├── services/          # Service classes
│   ├── tools/             # Development tools
│   └── utils/             # Utility functions
├── data/                  # Database and data storage
└── docs/                  # Documentation
```

## Running the Bot
- `npm start` - Start the bot
- `npm run dev` - Start with nodemon for development

## Required Environment Variables
- `TOKEN` - Discord bot token
- `OWNER_ID` - Bot owner's Discord user ID

## Optional Environment Variables
- `PREFIX` - Command prefix (default: +)
- `STATS_CHANNEL_MEMBERS` - Channel ID for member stats
- `STATS_CHANNEL_ONLINE` - Channel ID for online stats
- `STATS_CHANNEL_VOICE` - Channel ID for voice stats

## Tech Stack
- Node.js 18+
- discord.js v14
- better-sqlite3 for database
- winston for logging

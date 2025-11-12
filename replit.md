# Haruka Protect - Discord Bot

## Overview
Bot Discord professionnel de modération ultra-sécurisé avec fonctionnalités avancées de protection et d'administration.

**Current State:** Configured and running on Replit  
**Last Updated:** November 12, 2025

## Project Architecture

### Technology Stack
- **Runtime:** Node.js 18.x
- **Framework:** Discord.js v14
- **Database:** SQLite3 (better-sqlite3)
- **Logging:** Winston
- **Package Manager:** npm

### Project Structure
```
src/
├── commands/        # Bot commands (moderation, utility, admin, etc.)
├── core/           # Core bot client and initialization
├── database/       # SQLite database management
├── events/         # Discord event handlers
├── handlers/       # Command, event, permission handlers
├── jobs/           # Background tasks (stats updater)
├── security/       # Security modules (anti-raid, anti-spam, etc.)
├── services/       # Service layer (automod, cache, config)
└── utils/          # Utilities and helpers
```

### Database
- **Type:** SQLite (file-based)
- **Location:** `./data/haruka.db` (auto-created)
- **Tables:** sanctions, tickets, warnings, guild_config, automod_config, logs_config, reminders, afk_status, notes

### Features
- Advanced moderation (ban, kick, warn, mute, timeout)
- Security systems (anti-raid, anti-spam, anti-nuke, anti-bot)
- Logging system (messages, joins, leaves, voice, mod actions)
- Ticket system
- Auto-role and verification
- Statistics tracking
- AFK status
- Reminders
- Server info and user profiles

## Configuration

### Required Environment Variables
- `TOKEN` - Discord bot token (from Discord Developer Portal)
- `OWNER_ID` - Discord user ID of the bot owner

### Optional Environment Variables
- `PREFIX` - Command prefix (default: `+`)
- `EMBED_COLOR` - Embed color (default: `#FF69B4`)
- `STATS_CHANNEL_MEMBERS` - Voice channel ID for member stats
- `STATS_CHANNEL_ONLINE` - Voice channel ID for online stats  
- `STATS_CHANNEL_VOICE` - Voice channel ID for voice stats
- `STATS_UPDATE_INTERVAL` - Stats update interval in seconds (default: 300)
- `SECURITY_AUDIT_ON_START` - Run security audit on startup (default: false)
- `LOG_LEVEL` - Logging level (default: info)

## Running the Bot

### Development
The bot runs automatically via the configured workflow using `npm start`.

### Required Discord Intents
Make sure these are enabled in Discord Developer Portal:
- Guilds
- Guild Members (privileged)
- Guild Messages
- Message Content (privileged)
- Guild Presences (privileged)
- Guild Voice States

## Recent Changes
- **Nov 12, 2025**: Initial Replit setup complete
  - Installed all dependencies
  - Configured workflow for bot execution
  - Set up environment variables (TOKEN, OWNER_ID)
  - Database auto-initialization on first run

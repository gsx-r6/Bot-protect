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
- **Tables:** sanctions, tickets, warnings, guild_config, automod_config, logs_config, notes, user_data

**Note:** If upgrading from an older version, you may have obsolete tables (`afk_status`, `reminders`) that can be safely ignored or dropped manually using SQLite commands if you want to clean up the database.

### Features
- Advanced moderation (ban, kick, warn, mute, timeout, tempban, nuke, purge, slowmode)
- Security systems (anti-raid, anti-spam, anti-nuke, anti-bot, anti-link, anti-flood, anti-mention, anti-edit, anti-joinraid)
- Logging system (messages, joins, leaves, voice, mod actions)
- Ticket system
- Auto-role and verification
- Statistics tracking
- Server and role information
- Staff management (notes, reports, broadcast)

### Commands List

**Administration** (16 commands)
- `config` - View complete server configuration
- `dashboard` - Complete control panel with stats
- `setup` - Interactive setup guide
- `setcolor` - Customize embed colors (with presets)
- `resetconfig` - Reset server configuration
- `autorole`, `removeautorole` - Automatic role assignment
- `setprefix` - Change bot prefix
- `setlogs`, `setmodlogs` - Configure logging channels
- `setwelcome`, `setgoodbye` - Configure welcome/goodbye messages
- `setverif` - Configure verification system
- `setup-stats` - Setup statistics voice channels
- `maintenance` - Toggle maintenance mode
- `restartbot` - Restart the bot

**Moderation** (17 commands)
- `ban`, `unban`, `tempban` - Ban management
- `kick` - Kick members
- `mute`, `unmute` - Mute management
- `timeout` - Timeout members
- `warn`, `delwarn`, `warnings`, `checkwarns` - Warning system
- `lock-channel`, `unlock` - Channel locking
- `clear`, `purge` - Message deletion
- `nuke` - Channel recreation
- `slowmode` - Set channel slowmode

**Security** (11 commands)
- `antibot`, `antispam`, `antilink`, `antiflood` - Auto-moderation toggles
- `antimention`, `antiedit`, `antijoinraid`, `antinuke` - Advanced protection
- `verify` - Manual verification
- `checkperms` - Check permissions
- `security-check` - Run security audit

**Logging** (6 commands)
- `joinlog`, `leavelog` - Member join/leave logging
- `messagelog` - Message edit/delete logging
- `voicelog` - Voice channel activity logging
- `modlog` - Moderation actions logging
- `logstatus` - View logging configuration

**Staff** (4 commands)
- `broadcast` - Send announcements
- `notes` - Manage member notes
- `report` - Report system
- `stafflist` - List staff members

**Information** (1 command)
- `roleinfo` - Display role information

**Utility** (13 commands)
- `help` - Command list and help
- `ping` - Bot latency
- `uptime` - Bot uptime
- `botinfo` - Bot information
- `serverinfo` - Server information
- `userinfo` - User information
- `stats` - Server statistics
- `membercount`, `channelcount`, `rolecount` - Count commands
- `embed` - Create custom embeds
- `say` - Make bot send message
- `invite` - Bot invite link
- `ticket` - Ticket system
- `support` - Support information

**System** (2 commands)
- `reload` - Reload commands
- `shutdown` - Shutdown the bot

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
- **Nov 12, 2025**: Professional configuration system added
  - Created `config` command - View complete server configuration
  - Created `dashboard` command - Full control panel with server stats
  - Created `setup` command - Interactive configuration guide
  - Created `setcolor` command - Customize embed colors per server (12 presets + hex)
  - Created `resetconfig` command - Safe configuration reset
  - Improved `help` command - Better organization and visuals
  - Added database migration system for safe schema updates
  - Added per-guild embed color customization
  - Total commands: 70 (professional-grade protection/moderation)

- **Nov 12, 2025**: Command cleanup and optimization
  - Removed non-essential commands (afk, avatar, banner, calc, editsnipe, poll, pollmulti, remind, snipe, suggest, timezone, translate, profile)
  - Cleaned up database schema (removed afk_status and reminders tables)
  - Focused on core moderation, security, and administration features
  
- **Nov 12, 2025**: Initial Replit setup complete
  - Installed all dependencies
  - Configured workflow for bot execution
  - Set up environment variables (TOKEN, OWNER_ID)
  - Database auto-initialization on first run

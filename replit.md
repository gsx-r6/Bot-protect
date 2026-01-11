# Bot-Protect (UHQ Monde)

## Overview

Bot-Protect is a robust Discord moderation and security bot designed to protect communities against raids, spam, and malicious actions. It features 103+ commands across 10 categories (Security, Moderation, Administration, Tickets, Logging, Utility, Information, Staff, System, Owner) with advanced protection systems including anti-raid, anti-spam, role protection, and automated backups.

The bot is built as a monolithic Node.js application using Discord.js v14 with SQLite for data persistence. It implements a hierarchical permission system with 11 levels and provides comprehensive logging, ticket management, and server backup/restore capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Application Structure
- **Entry Point**: `index.js` loads environment variables and delegates to `src/core/index.js`
- **Client**: Custom `NamiClient` class extending Discord.js Client with commands, aliases, and cooldowns collections
- **Handlers**: Modular command and event loading system that recursively scans directories

### Command System
- Commands organized by category in `src/commands/` subdirectories
- Each command exports an object with name, description, permissions, cooldown, and execute function
- Alias support through `client.aliases` collection
- Cooldown management via `CooldownHandler` service

### Event System
- Events organized by category in `src/events/` subdirectories
- Automatic registration with support for `once` and `on` event types
- Error handling wrapper around all event executions

### Security Modules (`src/security/`)
- **AntiRaid**: Detects join spikes with configurable thresholds, quarantines suspicious members
- **AntiSpam**: Message rate limiting with automatic mute enforcement
- **RoleProtector**: Monitors role changes, maintains snapshots, auto-restores protected roles
- **MemberProtector**: Prevents unauthorized role removal from protected members
- **AntiBot**: Kicks unauthorized bots that join the server

### Service Layer (`src/services/`)
- **LogService**: Centralized logging to Discord channels and local files with embed formatting
- **BackupService**: Full server backup/restore including roles, channels, and emojis
- **ConfigService**: Guild-specific configuration with caching
- **AutomodService**: Manages automod feature toggles per guild
- **JTCService**: Join-to-Create voice channel management
- **CaseService**: Tracks moderation infractions with expiration

### Database Layer
- **SQLite** via `better-sqlite3` for synchronous operations
- Schema defined in `src/database/schema.js` with auto-migration support
- Tables: `guild_config`, `automod_config`, `sanctions`, `tickets`, `ticket_config`, `logger_channels`, `warnings`, `cases`

### Permission System
- 11-tier hierarchical permission levels defined in `src/config/permissions.js`
- Owner bypass for all restrictions
- Role-based level assignment with rate limiting per action type
- `PermissionHandler` utility for hierarchy checks

### Background Jobs (`src/jobs/`)
- **AutoBackup**: Scheduled daily backups at 3 AM
- **StatsVoiceUpdater**: Periodic voice channel stats updates

## External Dependencies

### Core Dependencies
- **discord.js ~14.25.1**: Discord API wrapper with gateway websocket handling
- **better-sqlite3 ~8.7.0**: Native SQLite3 bindings for synchronous database operations
- **dotenv ~16.6.1**: Environment variable loading from `.env` files
- **winston ~3.18.3**: Logging framework (partially used alongside custom logger)
- **chalk ~4.1.2**: Terminal string styling for console output

### Optional Dependencies
- **@napi-rs/canvas ~0.1.88**: Image generation for welcome cards (fallback to embeds if unavailable)

### Development Dependencies
- **eslint ~8.57.1**: Code linting
- **jest ~29.7.0**: Testing framework
- **nodemon ~3.1.11**: Development auto-reload

### Required Environment Variables
- `TOKEN`: Discord bot token (critical)
- `OWNER_ID`: Bot owner's Discord user ID (critical)
- `SQLITE_PATH`: Database file path (optional, defaults to `./data/nami.db`)
- `PREFIX`: Command prefix (optional, defaults to `+`)
- Various `LOG_CHANNEL_*` variables for logging destinations

### External Services
- **Discord API**: Primary integration via websockets for real-time events and REST for actions
- No other external APIs or services required - fully self-contained
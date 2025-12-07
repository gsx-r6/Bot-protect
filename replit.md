# Overview

Bot-Protect (also referenced as Nami-Protect) is a Discord moderation and server management bot built with Discord.js v14. The bot provides comprehensive server administration, logging, security features, and automated moderation capabilities. It uses a message-based command system with a configurable prefix and implements role-based permission hierarchies for server management.

# Recent Changes

**Date: November 24, 2025**
- Optimized LogService for improved performance and responsiveness
  - Implemented lazy loading cache system for log channels (per guild/channel pair)
  - Removed blocking await calls in events (messageDelete, guildMemberAdd) to prevent event delays
  - Maintained accurate promise-based error handling for commands that require log confirmation
  - Log messages now appear instantly in Discord without blocking bot events
  - Fixed issue where logs took a long time to appear in their designated channels

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture

**Runtime & Framework**
- Node.js 18+ runtime with Discord.js v14 for Discord API integration
- Message-based command system with prefix configuration (default: `+`)
- Custom client class (`NamiClient`) extending Discord.js Client with command/alias collections and cooldown management

**Command Handler Pattern**
- Commands organized by category in `src/commands/` directory (administration, information, logging, moderation)
- Dynamic command loading via `commandHandler` that scans category directories
- Alias system for command shortcuts
- Per-command cooldown tracking via `CooldownHandler`
- Permission validation at command level using Discord permission flags

**Event System**
- Event-driven architecture using Discord.js gateway events
- Events organized by category in `src/events/` directory
- Automatic event registration via `eventHandler` with support for both `once` and `on` listeners

## Data Persistence

**Database Layer**
- SQLite3 via `better-sqlite3` for synchronous database operations
- Database file stored in `data/nami.db`
- Schema includes: sanctions, tickets, user_data, guild_config, warnings, notes, automod_config, logs_config, role_blacklist
- Service layer pattern with dedicated services (ConfigService, AutomodService, RankPermissionService, LogService, CacheService)

**Configuration Management**
- Guild-specific configuration stored in database (prefix, channels, colors, autorole, welcome/goodbye messages)
- Environment variable fallbacks for default configuration
- Runtime configuration accessible via `client.config`

## Logging System

**Multi-Level Logging**
- Custom Logger class with console output (colored via chalk) and file persistence
- Log levels: info, success, warn, error, debug, command
- Log files stored in `data/logs/` (combined.log, error.log, debug.log)
- Timestamp formatting in French locale

**Discord Channel Logging**
- LogService provides categorized logging to dedicated Discord channels
- 8 log categories: moderation, member, message, voice, guild, security, roles, channels
- Channel IDs configured via environment variables
- Embed-based log messages with color coding
- Fallback to local file logging when Discord channels unavailable

## Security & Protection

**Hierarchical Permission System**
- Role hierarchy validation prevents lower-ranked users from moderating higher-ranked users
- Bot position checking ensures bot can perform requested actions
- Special admin role system with configurable rank ceilings
- Role blacklist (BLR) prevents specific users from receiving roles

**Automated Security Features**
- AntiBot: Monitors bot joins and optionally kicks non-whitelisted bots
- AntiRaid: Tracks join velocity to detect raid patterns (configurable threshold/timeframe)
- AntiSpam: Message frequency monitoring with escalation capability
- MemberProtector: Protects VIP members from role changes
- RoleProtector: Monitors and can revert unauthorized role modifications
- SecurityAudit: Startup validation of environment variables, hardcoded secrets scanning, file structure validation

**Audit & Compliance**
- Optional security audit on startup (configurable via `SECURITY_AUDIT_ON_START`)
- Vulnerability detection with optional blocking on critical issues
- Scanning for hardcoded secrets (Discord tokens, API keys, MongoDB URIs)

## Feature Modules

**Statistics System**
- Voice channel name updates showing real-time server stats
- Three stat types: total members + online count, voice channel occupancy
- Background job (`statsVoiceUpdater`) with configurable update interval
- Presence and voice state intents required for accurate counts

**Moderation Tools**
- Role management with hierarchical permission validation (rank, unrank commands)
- Interactive rank panel with pagination and select menus
- Auto-role assignment for new members
- Configuration dashboard with status overview

**Welcome/Goodbye System**
- Configurable welcome and goodbye messages with variable substitution ({user}, {server}, {count})
- Dedicated channels for welcome/goodbye events
- Message templates stored in guild configuration

## Error Handling

**Structured Error System**
- Centralized ErrorHandler with predefined error types (MISSING_PERMISSIONS, INVALID_ARGUMENT, COOLDOWN, etc.)
- Embed-based error responses with clear user guidance
- Permission name translation to French
- Try-catch blocks around all database operations and Discord API calls

**Graceful Degradation**
- Unhandled rejection and uncaught exception handlers
- Fallback mechanisms for missing configuration
- Database table auto-creation if missing
- Directory structure validation with automatic creation

# External Dependencies

**Core Dependencies**
- `discord.js` (v14.14.1): Discord API wrapper and gateway client
- `better-sqlite3` (v8.4.0): Synchronous SQLite database driver
- `dotenv` (v16.3.1): Environment variable management from .env files
- `winston` (v3.9.0): Logging library (listed but custom logger implementation used instead)
- `chalk` (v4.1.2): Terminal color formatting for console logs

**Development Dependencies**
- `nodemon` (v3.0.2): Development auto-restart on file changes
- `eslint` (v8.55.0): Code linting
- `jest` (v29.7.0): Testing framework

**Discord API Requirements**
- Gateway Intents: Guilds, GuildMembers, GuildMessages, MessageContent, GuildMessageReactions, GuildPresences, GuildVoiceStates
- Bot Permissions: Manage Roles, Manage Channels, Ban Members, Kick Members, Manage Messages, Send Messages, Embed Links, etc.

**Environment Variables**
- Required: `TOKEN` (Discord bot token), `OWNER_ID` (bot owner Discord ID)
- Optional: `PREFIX`, `EMBED_COLOR`, log channel IDs (8 categories), stats channel IDs (3 types), `LOG_LEVEL`, security feature flags, automod thresholds

**Data Storage**
- SQLite database file: `data/nami.db`
- Log files directory: `data/logs/`
- Cache, backups directories: `data/cache/`, `data/backups/`
- All data directories include .gitkeep files for version control

**Hosting Considerations**
- Entry point: `index.js` (proxy to `src/core/index.js`)
- Process management: Handles SIGTERM, unhandled rejections, uncaught exceptions
- Startup validation: Optional security audit before going online
- Environment detection: Checks for .env file or uses system environment variables
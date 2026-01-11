# UHQ Monde Discord Bot

## Overview
A Discord moderation bot built with Node.js and discord.js. Provides comprehensive server management including moderation, security, logging, and utility commands.

## Project Structure
- `src/core/` - Bot client and entry point
- `src/commands/` - Command modules organized by category (administration, moderation, security, etc.)
- `src/events/` - Discord event handlers
- `src/handlers/` - Command, event, cooldown, and permission handlers
- `src/services/` - Business logic services (AutoMod, Backup, Cache, Config, etc.)
- `src/security/` - Anti-raid, anti-spam, and security systems
- `src/database/` - SQLite database configuration and schema
- `src/utils/` - Utility functions and logger
- `data/` - Runtime data including SQLite database and logs

## Tech Stack
- Node.js 20
- discord.js 14.x
- better-sqlite3 for local database
- winston for logging
- dotenv for environment configuration

## Running the Bot
The bot runs via the "Discord Bot" workflow using `npm start`.

## Required Environment Variables
- `TOKEN` - Discord bot token (required)
- `OWNER_ID` - Bot owner's Discord user ID (required)
- `PREFIX` - Command prefix (default: `+`)

## Optional Environment Variables
- `EMBED_COLOR` - Default embed color
- `STATS_CHANNEL_MEMBERS`, `STATS_CHANNEL_ONLINE`, `STATS_CHANNEL_VOICE` - Stats channel IDs
- `LOG_CHANNEL_*` - Various log channel configurations

## Development
- `npm run dev` - Run with nodemon for auto-reload
- `npm run lint` - ESLint code checking
- `npm run test` - Run Jest tests

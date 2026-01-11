const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const logger = require('../utils/logger');
const schema = require('./schema');

class DB {
    constructor() {
        const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'nami.db');
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        try {
            this.db = new Database(dbPath);
            logger.info(`SQLite DB opened at ${dbPath}`);
            this._init();
        } catch (error) {
            logger.error(`Failed to open database at ${dbPath}:`, error);
            process.exit(1);
        }
    }

    _init() {
        try {
            // Load all tables from schema
            for (const [tableName, createQuery] of Object.entries(schema)) {
                this.db.prepare(createQuery).run();
            }
            this._runMigrations();
        } catch (error) {
            logger.error('Database initialization failed:', error);
            throw error;
        }
    }

    _runMigrations() {
        try {
            const migrations = [
                {
                    table: 'guild_config',
                    column: 'embed_color',
                    query: "ALTER TABLE guild_config ADD COLUMN embed_color TEXT DEFAULT '#FF69B4'"
                },
                {
                    table: 'logger_channels',
                    column: 'automod_log',
                    query: "ALTER TABLE logger_channels ADD COLUMN automod_log TEXT"
                },
                // Ticket migrations handled as a block for simplicity
                {
                    table: 'automod_config',
                    column: 'antiraid_threshold',
                    query: "ALTER TABLE automod_config ADD COLUMN antiraid_threshold INTEGER DEFAULT 10"
                },
                {
                    table: 'automod_config',
                    column: 'antiraid_timeframe',
                    query: "ALTER TABLE automod_config ADD COLUMN antiraid_timeframe INTEGER DEFAULT 10000"
                },
                {
                    table: 'guild_config',
                    column: 'quarantine_role_id',
                    query: "ALTER TABLE guild_config ADD COLUMN quarantine_role_id TEXT"
                },
                {
                    table: 'automod_config',
                    column: 'antispam_threshold',
                    query: "ALTER TABLE automod_config ADD COLUMN antispam_threshold INTEGER DEFAULT 5"
                },
                {
                    table: 'automod_config',
                    column: 'antispam_action',
                    query: "ALTER TABLE automod_config ADD COLUMN antispam_action TEXT DEFAULT 'mute'"
                },
                {
                    table: 'automod_config',
                    column: 'antispam_timeframe',
                    query: "ALTER TABLE automod_config ADD COLUMN antispam_timeframe INTEGER DEFAULT 5000"
                },
                {
                    table: 'guild_config',
                    column: 'verify_role_id',
                    query: "ALTER TABLE guild_config ADD COLUMN verify_role_id TEXT"
                },
                {
                    table: 'guild_config',
                    column: 'verify_message',
                    query: "ALTER TABLE guild_config ADD COLUMN verify_message TEXT"
                }
            ];

            for (const migration of migrations) {
                const tableInfo = this.db.prepare(`PRAGMA table_info(${migration.table})`).all();
                if (!tableInfo.some(col => col.name === migration.column)) {
                    logger.info(`Running migration: Adding ${migration.column} to ${migration.table}`);
                    this.db.prepare(migration.query).run();
                }
            }

            // Ticket specific columns
            const ticketsTableInfo = this.db.prepare("PRAGMA table_info(tickets)").all();
            if (!ticketsTableInfo.some(col => col.name === 'claimed_by')) {
                logger.info('Running migration: Adding new columns to tickets table');
                const ticketCols = [
                    "ALTER TABLE tickets ADD COLUMN claimed_by TEXT",
                    "ALTER TABLE tickets ADD COLUMN topic TEXT",
                    "ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'normal'",
                    "ALTER TABLE tickets ADD COLUMN closed_at TEXT",
                    "ALTER TABLE tickets ADD COLUMN closed_by TEXT"
                ];
                ticketCols.forEach(q => this.db.prepare(q).run());
                logger.info('Migration completed: tickets table updated successfully');
            }

        } catch (err) {
            logger.warn('Migration check/execution failed: ' + err.message);
        }
    }

    // --- Generic Helpers ---

    /**
     * Generic method to get configuration
     * @param {string} table Name of the table
     * @param {string} keyColumn Name of the primary key column (e.g., 'guild_id')
     * @param {string} keyValue Value of the primary key
     */
    _getConfig(table, keyColumn, keyValue) {
        try {
            return this.db.prepare(`SELECT * FROM ${table} WHERE ${keyColumn} = ?`).get(keyValue);
        } catch (error) {
            logger.error(`Error fetching config from ${table}:`, error);
            return null;
        }
    }

    /**
     * Generic method to set configuration
     * @param {string} table Name of the table
     * @param {string} keyColumn Name of the primary key column
     * @param {string} keyValue Value of the primary key
     * @param {string} configKey Column to update
     * @param {any} value New value
     */
    _setConfig(table, keyColumn, keyValue, configKey, value) {
        try {
            const config = this._getConfig(table, keyColumn, keyValue);
            if (!config) {
                this.db.prepare(`INSERT INTO ${table} (${keyColumn}, ${configKey}, updated_at) VALUES (?, ?, ?)`).run(keyValue, value, new Date().toISOString());
            } else {
                this.db.prepare(`UPDATE ${table} SET ${configKey} = ?, updated_at = ? WHERE ${keyColumn} = ?`).run(value, new Date().toISOString(), keyValue);
            }
        } catch (error) {
            logger.error(`Error setting config in ${table}:`, error);
            throw error;
        }
    }

    // --- Specific Implementation Helpers ---

    addSanction(guild, user, type, reason, mod) {
        this.db.prepare('INSERT INTO sanctions (guild,user,type,reason,moderator,date) VALUES (?,?,?,?,?,?)')
            .run(guild, user, type, reason, mod, new Date().toISOString());
    }

    // Tickets helpers
    addTicket(guild, channel, owner, topic = null) {
        const info = this.db.prepare('INSERT INTO tickets (guild, channel, owner, topic, status, created_at) VALUES (?,?,?,?,?,?)')
            .run(guild, channel, owner, topic, 'open', new Date().toISOString());
        return info.lastInsertRowid;
    }

    getTicketByChannel(channel) {
        return this.db.prepare('SELECT * FROM tickets WHERE channel = ?').get(channel);
    }

    getOpenTicketsByUser(guildId, userId) {
        return this.db.prepare('SELECT * FROM tickets WHERE guild = ? AND owner = ? AND status = ?').all(guildId, userId, 'open');
    }

    getOpenTicketsCount(guildId, userId) {
        return this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild = ? AND owner = ? AND status = ?').get(guildId, userId, 'open').count;
    }

    getAllOpenTickets(guildId) {
        return this.db.prepare('SELECT * FROM tickets WHERE guild = ? AND status = ? ORDER BY created_at DESC').all(guildId, 'open');
    }

    claimTicket(channelId, claimedBy) {
        this.db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel = ?').run(claimedBy, channelId);
    }

    closeTicket(channelId, closedBy) {
        this.db.prepare('UPDATE tickets SET status = ?, closed_at = ?, closed_by = ? WHERE channel = ?')
            .run('closed', new Date().toISOString(), closedBy, channelId);
    }

    getTicketStats(guildId) {
        return {
            total: this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild = ?').get(guildId).count,
            open: this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild = ? AND status = ?').get(guildId, 'open').count,
            closed: this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild = ? AND status = ?').get(guildId, 'closed').count
        };
    }

    // Ticket config
    getTicketConfig(guildId) {
        return this._getConfig('ticket_config', 'guild_id', guildId);
    }

    setTicketConfig(guildId, key, value) {
        const validKeys = ['staff_role', 'category_id', 'log_channel', 'max_tickets', 'panel_title', 'panel_description', 'panel_color', 'welcome_message', 'transcript_enabled'];
        if (!validKeys.includes(key)) throw new Error(`Invalid ticket config key: ${key}`);
        this._setConfig('ticket_config', 'guild_id', guildId, key, value);
    }

    resetTicketConfig(guildId) {
        this.db.prepare('DELETE FROM ticket_config WHERE guild_id = ?').run(guildId);
    }

    // User data
    upsertUserData(userId, data) {
        this.db.prepare('INSERT INTO user_data (user_id, data, updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
            .run(userId, JSON.stringify(data || {}), new Date().toISOString());
    }

    deleteUserData(userId) {
        this.db.prepare('DELETE FROM user_data WHERE user_id = ?').run(userId);
    }

    // Warnings
    addWarning(guildId, userId, moderatorId, reason) {
        this.db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?,?,?,?,?)')
            .run(guildId, userId, moderatorId, reason, new Date().toISOString());
    }

    getWarnings(guildId, userId) {
        return this.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
    }

    deleteWarning(warnId) {
        this.db.prepare('DELETE FROM warnings WHERE id = ?').run(warnId);
    }

    getWarningCount(guildId, userId) {
        return this.db.prepare('SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?').get(guildId, userId).count;
    }

    // Guild config
    getGuildConfig(guildId) {
        return this._getConfig('guild_config', 'guild_id', guildId);
    }

    setGuildConfig(guildId, key, value) {
        this._setConfig('guild_config', 'guild_id', guildId, key, value);
    }

    // Rank permissions
    getRankPermission(guildId, roleId) {
        return this.db.prepare('SELECT * FROM rank_permissions WHERE guild_id = ? AND role_id = ?').get(guildId, roleId);
    }

    getAllRankPermissions(guildId) {
        return this.db.prepare('SELECT * FROM rank_permissions WHERE guild_id = ? ORDER BY position DESC').all(guildId);
    }

    setRankPermission(guildId, roleId, canGiveRoles, permissionType = 'hierarchy', position = 0) {
        const rolesJson = JSON.stringify(canGiveRoles || []);
        const existing = this.getRankPermission(guildId, roleId);

        if (!existing) {
            this.db.prepare('INSERT INTO rank_permissions (guild_id, role_id, can_give_roles, permission_type, position, updated_at) VALUES (?,?,?,?,?,?)')
                .run(guildId, roleId, rolesJson, permissionType, position, new Date().toISOString());
        } else {
            this.db.prepare('UPDATE rank_permissions SET can_give_roles = ?, permission_type = ?, position = ?, updated_at = ? WHERE guild_id = ? AND role_id = ?')
                .run(rolesJson, permissionType, position, new Date().toISOString(), guildId, roleId);
        }
    }

    deleteRankPermission(guildId, roleId) {
        this.db.prepare('DELETE FROM rank_permissions WHERE guild_id = ? AND role_id = ?').run(guildId, roleId);
    }

    // Automod config
    getAutomodConfig(guildId) {
        return this._getConfig('automod_config', 'guild_id', guildId);
    }

    setAutomodConfig(guildId, key, value) {
        this._setConfig('automod_config', 'guild_id', guildId, key, value);
    }

    // Logger channels
    getLoggerChannels(guildId) {
        return this._getConfig('logger_channels', 'guild_id', guildId);
    }

    setLoggerChannel(guildId, logType, channelId) {
        const validTypes = ['channel_log', 'emoji_log', 'ban_log', 'join_log', 'leave_log', 'message_log', 'voice_log', 'mod_log', 'automod_log'];
        if (!validTypes.includes(logType)) throw new Error(`Invalid log type: ${logType}`);
        this._setConfig('logger_channels', 'guild_id', guildId, logType, channelId);
    }

    removeLoggerChannel(guildId, logType) {
        const validTypes = ['channel_log', 'emoji_log', 'ban_log', 'join_log', 'leave_log', 'message_log', 'voice_log', 'mod_log', 'automod_log'];
        if (!validTypes.includes(logType)) throw new Error(`Invalid log type: ${logType}`);

        // This is slightly different from _setConfig because it sets to NULL, so keeping specific logic is fine or could be genericized
        this.db.prepare(`UPDATE logger_channels SET ${logType} = NULL, updated_at = ? WHERE guild_id = ?`)
            .run(new Date().toISOString(), guildId);
    }

    // Rate State Persistence
    getRaidState(guildId) {
        return this.db.prepare('SELECT * FROM raid_states WHERE guild_id = ?').get(guildId);
    }

    setRaidState(guildId, isActive, quarantinedMembers = []) {
        const membersJson = JSON.stringify(quarantinedMembers);
        const existing = this.getRaidState(guildId);

        if (!existing) {
            this.db.prepare('INSERT INTO raid_states (guild_id, is_active, quarantined_members, started_at, updated_at) VALUES (?, ?, ?, ?, ?)')
                .run(guildId, isActive ? 1 : 0, membersJson, isActive ? new Date().toISOString() : null, new Date().toISOString());
        } else {
            // Only update started_at if we are activating it and it wasn't valid before, otherwise keep original start time
            const startedAt = isActive ? (existing.started_at || new Date().toISOString()) : null;
            this.db.prepare('UPDATE raid_states SET is_active = ?, quarantined_members = ?, started_at = ?, updated_at = ? WHERE guild_id = ?')
                .run(isActive ? 1 : 0, membersJson, startedAt, new Date().toISOString(), guildId);
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            logger.info('SQLite database connection closed.');
        }
    }
}

module.exports = new DB();

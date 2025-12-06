const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const logger = require('../utils/logger');

class DB {
    constructor() {
        const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'haruka.db');
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        this.db = new Database(dbPath);
        logger.info(`SQLite DB opened at ${dbPath}`);
        this._init();
    }

    _init() {
        this.db.prepare(`CREATE TABLE IF NOT EXISTS sanctions (id INTEGER PRIMARY KEY, guild TEXT, user TEXT, type TEXT, reason TEXT, moderator TEXT, date TEXT)`).run();
        this.db.prepare(`CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, guild TEXT, channel TEXT, owner TEXT, status TEXT, created_at TEXT)`).run();
        this.db.prepare(`CREATE TABLE IF NOT EXISTS user_data (id INTEGER PRIMARY KEY, user_id TEXT UNIQUE, data TEXT, updated_at TEXT)`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS guild_config (
            guild_id TEXT PRIMARY KEY,
            prefix TEXT DEFAULT '+',
            welcome_channel TEXT,
            welcome_message TEXT,
            goodbye_channel TEXT,
            goodbye_message TEXT,
            log_channel TEXT,
            modlog_channel TEXT,
            verify_channel TEXT,
            autorole_id TEXT,
            embed_color TEXT DEFAULT '#FF69B4',
            updated_at TEXT
        )`).run();

        this._runMigrations();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT,
            user_id TEXT,
            moderator_id TEXT,
            reason TEXT,
            created_at TEXT
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT,
            user_id TEXT,
            moderator_id TEXT,
            note TEXT,
            created_at TEXT
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS automod_config (
            guild_id TEXT PRIMARY KEY,
            antispam BOOLEAN DEFAULT 0,
            antilink BOOLEAN DEFAULT 0,
            antiflood BOOLEAN DEFAULT 0,
            antimention BOOLEAN DEFAULT 0,
            antijoinraid BOOLEAN DEFAULT 0,
            antinuke BOOLEAN DEFAULT 0,
            antiedit BOOLEAN DEFAULT 0,
            antibot BOOLEAN DEFAULT 0,
            updated_at TEXT
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS logs_config (
            guild_id TEXT PRIMARY KEY,
            message_log BOOLEAN DEFAULT 0,
            join_log BOOLEAN DEFAULT 0,
            leave_log BOOLEAN DEFAULT 0,
            mod_log BOOLEAN DEFAULT 0,
            voice_log BOOLEAN DEFAULT 0,
            updated_at TEXT
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS rank_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            can_give_roles TEXT,
            permission_type TEXT DEFAULT 'hierarchy',
            position INTEGER,
            updated_at TEXT,
            UNIQUE(guild_id, role_id)
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS role_blacklist (
            guild_id TEXT,
            user_id TEXT,
            moderator_id TEXT,
            created_at TEXT,
            PRIMARY KEY (guild_id, user_id)
        )`).run();

        this.db.prepare(`CREATE TABLE IF NOT EXISTS logger_channels (
            guild_id TEXT PRIMARY KEY,
            channel_log TEXT,
            emoji_log TEXT,
            ban_log TEXT,
            join_log TEXT,
            leave_log TEXT,
            message_log TEXT,
            voice_log TEXT,
            mod_log TEXT,
            automod_log TEXT,
            updated_at TEXT
        )`).run();

        this._runMigrations();
    }

    _runMigrations() {
        try {
            const tableInfo = this.db.prepare("PRAGMA table_info(guild_config)").all();
            const hasEmbedColor = tableInfo.some(col => col.name === 'embed_color');

            if (!hasEmbedColor) {
                logger.info('Running migration: Adding embed_color column to guild_config');
                this.db.prepare("ALTER TABLE guild_config ADD COLUMN embed_color TEXT DEFAULT '#FF69B4'").run();
                logger.info('Migration completed: embed_color column added successfully');
            }

            const loggerTableInfo = this.db.prepare("PRAGMA table_info(logger_channels)").all();
            const hasAutomodLog = loggerTableInfo.some(col => col.name === 'automod_log');

            if (!hasAutomodLog) {
                logger.info('Running migration: Adding automod_log column to logger_channels');
                this.db.prepare("ALTER TABLE logger_channels ADD COLUMN automod_log TEXT").run();
                logger.info('Migration completed: automod_log column added successfully');
            }
        } catch (err) {
            logger.warn('Migration check/execution failed (might be normal if table does not exist yet): ' + err.message);
        }
    }

    addSanction(guild, user, type, reason, mod) {
        const stmt = this.db.prepare('INSERT INTO sanctions (guild,user,type,reason,moderator,date) VALUES (?,?,?,?,?,?)');
        stmt.run(guild, user, type, reason, mod, new Date().toISOString());
    }

    // Tickets helpers
    addTicket(guild, channel, owner) {
        const stmt = this.db.prepare('INSERT INTO tickets (guild,channel,owner,status,created_at) VALUES (?,?,?,?,?)');
        const info = stmt.run(guild, channel, owner, 'open', new Date().toISOString());
        return info.lastInsertRowid;
    }

    getTicketByChannel(channel) {
        const stmt = this.db.prepare('SELECT * FROM tickets WHERE channel = ?');
        return stmt.get(channel);
    }

    closeTicket(channel) {
        const stmt = this.db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE channel = ?');
        return stmt.run('closed', new Date().toISOString(), channel);
    }

    // User data helpers (for profile deletion etc.)
    upsertUserData(userId, data) {
        const stmt = this.db.prepare('INSERT INTO user_data (user_id, data, updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at');
        return stmt.run(userId, JSON.stringify(data || {}), new Date().toISOString());
    }

    deleteUserData(userId) {
        const stmt = this.db.prepare('DELETE FROM user_data WHERE user_id = ?');
        return stmt.run(userId);
    }

    // Warnings helpers
    addWarning(guildId, userId, moderatorId, reason) {
        const stmt = this.db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?,?,?,?,?)');
        return stmt.run(guildId, userId, moderatorId, reason, new Date().toISOString());
    }

    getWarnings(guildId, userId) {
        const stmt = this.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC');
        return stmt.all(guildId, userId);
    }

    deleteWarning(warnId) {
        const stmt = this.db.prepare('DELETE FROM warnings WHERE id = ?');
        return stmt.run(warnId);
    }

    getWarningCount(guildId, userId) {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?');
        return stmt.get(guildId, userId).count;
    }

    // Guild config helpers
    getGuildConfig(guildId) {
        const stmt = this.db.prepare('SELECT * FROM guild_config WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    setGuildConfig(guildId, key, value) {
        const config = this.getGuildConfig(guildId);
        if (!config) {
            this.db.prepare(`INSERT INTO guild_config (guild_id, ${key}, updated_at) VALUES (?,?,?)`).run(guildId, value, new Date().toISOString());
        } else {
            this.db.prepare(`UPDATE guild_config SET ${key} = ?, updated_at = ? WHERE guild_id = ?`).run(value, new Date().toISOString(), guildId);
        }
    }

    getRankPermission(guildId, roleId) {
        const stmt = this.db.prepare('SELECT * FROM rank_permissions WHERE guild_id = ? AND role_id = ?');
        return stmt.get(guildId, roleId);
    }

    getAllRankPermissions(guildId) {
        const stmt = this.db.prepare('SELECT * FROM rank_permissions WHERE guild_id = ? ORDER BY position DESC');
        return stmt.all(guildId);
    }

    setRankPermission(guildId, roleId, canGiveRoles, permissionType = 'hierarchy', position = 0) {
        const existing = this.getRankPermission(guildId, roleId);
        const rolesJson = JSON.stringify(canGiveRoles || []);

        if (!existing) {
            const stmt = this.db.prepare('INSERT INTO rank_permissions (guild_id, role_id, can_give_roles, permission_type, position, updated_at) VALUES (?,?,?,?,?,?)');
            return stmt.run(guildId, roleId, rolesJson, permissionType, position, new Date().toISOString());
        } else {
            const stmt = this.db.prepare('UPDATE rank_permissions SET can_give_roles = ?, permission_type = ?, position = ?, updated_at = ? WHERE guild_id = ? AND role_id = ?');
            return stmt.run(rolesJson, permissionType, position, new Date().toISOString(), guildId, roleId);
        }
    }

    deleteRankPermission(guildId, roleId) {
        const stmt = this.db.prepare('DELETE FROM rank_permissions WHERE guild_id = ? AND role_id = ?');
        return stmt.run(guildId, roleId);
    }

    // Automod config helpers
    getAutomodConfig(guildId) {
        const stmt = this.db.prepare('SELECT * FROM automod_config WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    setAutomodConfig(guildId, key, value) {
        // Vérifier si la config existe
        const config = this.getAutomodConfig(guildId);
        if (!config) {
            // Créer avec la valeur par défaut pour la clé spécifiée
            // Note: On ne peut pas interpoler la clé directement dans INSERT sans risque, mais ici key est contrôlé par le code
            // Pour plus de sécurité, on initialise tout à 0 sauf la clé visée
            this.db.prepare(`INSERT INTO automod_config (guild_id, ${key}, updated_at) VALUES (?, ?, ?)`).run(guildId, value, new Date().toISOString());
        } else {
            this.db.prepare(`UPDATE automod_config SET ${key} = ?, updated_at = ? WHERE guild_id = ?`).run(value, new Date().toISOString(), guildId);
        }
    }

    getLoggerChannels(guildId) {
        const stmt = this.db.prepare('SELECT * FROM logger_channels WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    setLoggerChannel(guildId, logType, channelId) {
        const validTypes = ['channel_log', 'emoji_log', 'ban_log', 'join_log', 'leave_log', 'message_log', 'voice_log', 'mod_log', 'automod_log'];
        if (!validTypes.includes(logType)) {
            throw new Error(`Invalid log type: ${logType}`);
        }

        const config = this.getLoggerChannels(guildId);
        if (!config) {
            this.db.prepare(`INSERT INTO logger_channels (guild_id, ${logType}, updated_at) VALUES (?, ?, ?)`).run(guildId, channelId, new Date().toISOString());
        } else {
            this.db.prepare(`UPDATE logger_channels SET ${logType} = ?, updated_at = ? WHERE guild_id = ?`).run(channelId, new Date().toISOString(), guildId);
        }
    }

    removeLoggerChannel(guildId, logType) {
        const validTypes = ['channel_log', 'emoji_log', 'ban_log', 'join_log', 'leave_log', 'message_log', 'voice_log', 'mod_log', 'automod_log'];
        if (!validTypes.includes(logType)) {
            throw new Error(`Invalid log type: ${logType}`);
        }

        const config = this.getLoggerChannels(guildId);
        if (config) {
            this.db.prepare(`UPDATE logger_channels SET ${logType} = NULL, updated_at = ? WHERE guild_id = ?`).run(new Date().toISOString(), guildId);
        }
    }
}

module.exports = new DB();

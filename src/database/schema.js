module.exports = {
    sanctions: `CREATE TABLE IF NOT EXISTS sanctions (
        id INTEGER PRIMARY KEY,
        guild TEXT,
        user TEXT,
        type TEXT,
        reason TEXT,
        moderator TEXT,
        date TEXT
    )`,

    tickets: `CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY,
        guild TEXT,
        channel TEXT,
        owner TEXT,
        claimed_by TEXT,
        topic TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'open',
        created_at TEXT,
        closed_at TEXT,
        closed_by TEXT
    )`,

    ticket_config: `CREATE TABLE IF NOT EXISTS ticket_config (
        guild_id TEXT PRIMARY KEY,
        staff_role TEXT,
        category_id TEXT,
        log_channel TEXT,
        max_tickets INTEGER DEFAULT 1,
        panel_title TEXT DEFAULT 'Tickets de Support',
        panel_description TEXT DEFAULT 'Cliquez sur le bouton ci-dessous pour créer un ticket.',
        panel_color TEXT DEFAULT '#5865F2',
        welcome_message TEXT DEFAULT 'Bienvenue {user} ! Un membre du staff va vous assister.',
        transcript_enabled INTEGER DEFAULT 1,
        updated_at TEXT
    )`,

    user_data: `CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY,
        user_id TEXT UNIQUE,
        data TEXT,
        updated_at TEXT
    )`,

    guild_config: `CREATE TABLE IF NOT EXISTS guild_config (
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
        quarantine_role_id TEXT,
        embed_color TEXT DEFAULT '#FF69B4',
        updated_at TEXT
    )`,

    warnings: `CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        reason TEXT,
        created_at TEXT
    )`,

    notes: `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        note TEXT,
        created_at TEXT
    )`,

    automod_config: `CREATE TABLE IF NOT EXISTS automod_config (
        guild_id TEXT PRIMARY KEY,
        antispam BOOLEAN DEFAULT 0,
        antispam_threshold INTEGER DEFAULT 5,
        antispam_action TEXT DEFAULT 'mute',
        antilink BOOLEAN DEFAULT 0,
        antiflood BOOLEAN DEFAULT 0,
        antimention BOOLEAN DEFAULT 0,
        antijoinraid BOOLEAN DEFAULT 0,
        antiraid_threshold INTEGER DEFAULT 10,
        antiraid_timeframe INTEGER DEFAULT 10000,
        antinuke BOOLEAN DEFAULT 0,
        antiedit BOOLEAN DEFAULT 0,
        antibot BOOLEAN DEFAULT 0,
        updated_at TEXT
    )`,

    logs_config: `CREATE TABLE IF NOT EXISTS logs_config (
        guild_id TEXT PRIMARY KEY,
        message_log BOOLEAN DEFAULT 0,
        join_log BOOLEAN DEFAULT 0,
        leave_log BOOLEAN DEFAULT 0,
        mod_log BOOLEAN DEFAULT 0,
        voice_log BOOLEAN DEFAULT 0,
        updated_at TEXT
    )`,

    rank_permissions: `CREATE TABLE IF NOT EXISTS rank_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        can_give_roles TEXT,
        permission_type TEXT DEFAULT 'hierarchy',
        position INTEGER,
        updated_at TEXT,
        UNIQUE(guild_id, role_id)
    )`,

    role_blacklist: `CREATE TABLE IF NOT EXISTS role_blacklist (
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        created_at TEXT,
        PRIMARY KEY (guild_id, user_id)
    )`,

    logger_channels: `CREATE TABLE IF NOT EXISTS logger_channels (
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
    )`,
    raid_states: `CREATE TABLE IF NOT EXISTS raid_states (
        guild_id TEXT PRIMARY KEY,
        is_active BOOLEAN DEFAULT 0,
        quarantined_members TEXT,
        started_at TEXT,
        updated_at TEXT
    )`
};

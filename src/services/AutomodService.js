const db = require('../database/database');

class AutomodService {
    constructor() {
        this.client = null;
    }

    init(client) {
        this.client = client;
    }

    getConfig(guildId) {
        let stmt = db.db.prepare('SELECT * FROM automod_config WHERE guild_id = ?');
        let config = stmt.get(guildId);
        if (!config) {
            stmt = db.db.prepare('INSERT INTO automod_config (guild_id) VALUES (?)');
            stmt.run(guildId);
            config = { guild_id: guildId, antispam: 0, antilink: 0, antiflood: 0, antimention: 0, antijoinraid: 0, antinuke: 0, antiedit: 0, antibot: 0 };
        }
        return config;
    }

    setFeature(guildId, feature, enabled) {
        const validFeatures = ['antispam', 'antilink', 'antiflood', 'antimention', 'antijoinraid', 'antinuke', 'antiedit', 'antibot'];
        if (!validFeatures.includes(feature)) throw new Error('Invalid feature');
        
        this.getConfig(guildId);
        const stmt = db.db.prepare(`UPDATE automod_config SET ${feature} = ?, updated_at = ? WHERE guild_id = ?`);
        stmt.run(enabled ? 1 : 0, new Date().toISOString(), guildId);
        return true;
    }

    isEnabled(guildId, feature) {
        const config = this.getConfig(guildId);
        return config[feature] === 1;
    }
}

module.exports = new AutomodService();

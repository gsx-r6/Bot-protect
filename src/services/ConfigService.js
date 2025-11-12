const db = require('../database/database');

class ConfigService {
    getGuildConfig(guildId) {
        return db.getGuildConfig(guildId);
    }

    setGuildConfig(guildId, key, value) {
        return db.setGuildConfig(guildId, key, value);
    }

    getPrefix(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.prefix || process.env.PREFIX || '+';
    }

    setPrefix(guildId, prefix) {
        return this.setGuildConfig(guildId, 'prefix', prefix);
    }

    getWelcomeChannel(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.welcome_channel;
    }

    setWelcomeChannel(guildId, channelId) {
        return this.setGuildConfig(guildId, 'welcome_channel', channelId);
    }

    getWelcomeMessage(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.welcome_message || 'Bienvenue {user} sur {server} !';
    }

    setWelcomeMessage(guildId, message) {
        return this.setGuildConfig(guildId, 'welcome_message', message);
    }

    getGoodbyeChannel(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.goodbye_channel;
    }

    setGoodbyeChannel(guildId, channelId) {
        return this.setGuildConfig(guildId, 'goodbye_channel', channelId);
    }

    getGoodbyeMessage(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.goodbye_message || 'Au revoir {user} !';
    }

    setGoodbyeMessage(guildId, message) {
        return this.setGuildConfig(guildId, 'goodbye_message', message);
    }

    getLogChannel(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.log_channel;
    }

    setLogChannel(guildId, channelId) {
        return this.setGuildConfig(guildId, 'log_channel', channelId);
    }

    getModLogChannel(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.modlog_channel;
    }

    setModLogChannel(guildId, channelId) {
        return this.setGuildConfig(guildId, 'modlog_channel', channelId);
    }

    getVerifyChannel(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.verify_channel;
    }

    setVerifyChannel(guildId, channelId) {
        return this.setGuildConfig(guildId, 'verify_channel', channelId);
    }

    getAutorole(guildId) {
        const config = this.getGuildConfig(guildId);
        return config?.autorole_id;
    }

    setAutorole(guildId, roleId) {
        return this.setGuildConfig(guildId, 'autorole_id', roleId);
    }

    getEmbedColor(guildId) {
        try {
            const config = this.getGuildConfig(guildId);
            return config?.embed_color || process.env.EMBED_COLOR || '#FF69B4';
        } catch (err) {
            return process.env.EMBED_COLOR || '#FF69B4';
        }
    }

    setEmbedColor(guildId, color) {
        try {
            return this.setGuildConfig(guildId, 'embed_color', color);
        } catch (err) {
            throw new Error('Failed to set embed color. Database migration may be required.');
        }
    }

    resetGuildConfig(guildId) {
        const stmt = db.db.prepare('DELETE FROM guild_config WHERE guild_id = ?');
        return stmt.run(guildId);
    }
}

module.exports = new ConfigService();

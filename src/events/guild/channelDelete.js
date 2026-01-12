const { Events } = require('discord.js');
const db = require('../../database/database');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelDelete,
    once: false,

    async execute(channel, client) {
        if (!channel.guild) return;

        try {
            // 1. LEAKER-TRAP CLEANUP
            if (client.leakerTrap) {
                await client.leakerTrap.handleChannelDelete(channel);
            }

            // 2. LOG CHANNEL CLEANUP (Optional but good for robustness)
            const logChannels = db.getLoggerChannels(channel.guild.id);
            if (logChannels) {
                for (const [key, value] of Object.entries(logChannels)) {
                    if (value === channel.id) {
                        // logger.info(`[Cleanup] Log channel ${key} deleted in ${channel.guild.name}. Updating DB...`);
                        // db.setLoggerChannel(channel.guild.id, key, null); // Assuming this method exists or similar
                    }
                }
            }

            // 3. GUILD CONFIG CLEANUP
            const config = db.getGuildConfig(channel.guild.id);
            if (config) {
                const keysToCheck = ['welcome_channel', 'goodbye_channel', 'log_channel', 'modlog_channel', 'verify_channel'];
                for (const key of keysToCheck) {
                    if (config[key] === channel.id) {
                        logger.info(`[Cleanup] Config channel ${key} deleted in ${channel.guild.name}. Updating DB...`);
                        db.setGuildConfig(channel.guild.id, key, null);
                    }
                }
            }

        } catch (error) {
            logger.error(`[ChannelDelete] Error: ${error.message}`);
        }
    }
};

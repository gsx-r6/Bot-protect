const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelCreate,
    once: false,

    async execute(channel, client) {
        try {
            logger.info(`🆕 Canal créé: ${channel.name} (${channel.id})`);
            if (client.logs) {
                await client.logs.logChannels(channel.guild, 'CREATE', { channel });
            }
        } catch (e) {
            logger.error('[ChannelCreate] Error:', e);
        }
    }
};

const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelDelete,
    once: false,

    async execute(channel, client) {
        try {
            logger.info(`🗑️ Canal supprimé: ${channel.name} (${channel.id})`);
            if (client.logs) {
                await client.logs.logChannels(channel.guild, 'DELETE', { channel });
            }
        } catch (e) {
            logger.error('[ChannelDelete] Error:', e);
        }
    }
};

const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelDelete,
    once: false,

    async execute(channel, client) {
        try {
            if (!channel.guild) return;
            logger.info(`🗑️ Canal supprimé: ${channel.name} (${channel.id})`);
            
            if (client.logs) {
                client.logs.logChannels(channel.guild, 'DELETE', { channel }).catch(() => {});
            }
            
            if (client.loggerService) {
                client.loggerService.logChannelDelete(channel);
            }
        } catch (e) {
            logger.error('[ChannelDelete] Error:', e);
        }
    }
};

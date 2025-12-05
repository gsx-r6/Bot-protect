const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelCreate,
    once: false,

    async execute(channel, client) {
        try {
            if (!channel.guild) return;
            logger.info(`🆕 Canal créé: ${channel.name} (${channel.id})`);
            
            if (client.logs) {
                client.logs.logChannels(channel.guild, 'CREATE', { channel }).catch(() => {});
            }
            
            if (client.loggerService) {
                client.loggerService.logChannelCreate(channel);
            }
        } catch (e) {
            logger.error('[ChannelCreate] Error:', e);
        }
    }
};

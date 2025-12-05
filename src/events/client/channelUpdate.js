const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelUpdate,
    once: false,

    async execute(oldChannel, newChannel) {
        try {
            if (!newChannel.guild) return;
            const client = newChannel.client;
            logger.info(`✏️ Canal modifié: ${newChannel.name} (${newChannel.id})`);
            
            if (client.logs) {
                client.logs.logChannels(newChannel.guild, 'EDIT', { channel: newChannel, before: oldChannel, after: newChannel }).catch(() => {});
            }
            
            if (client.loggerService) {
                if (oldChannel.name !== newChannel.name) {
                    client.loggerService.logChannelUpdateName(oldChannel, newChannel);
                }
                if (oldChannel.nsfw !== newChannel.nsfw) {
                    client.loggerService.logChannelUpdateNSFW(oldChannel, newChannel);
                }
                if (oldChannel.topic !== newChannel.topic) {
                    client.loggerService.logChannelUpdateTopic(oldChannel, newChannel);
                }
                if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
                    client.loggerService.logChannelUpdateSlowmode(oldChannel, newChannel);
                }
            }
        } catch (e) {
            logger.error('[ChannelUpdate] Error:', e);
        }
    }
};

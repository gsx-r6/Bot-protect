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
                if (oldChannel.name !== newChannel.name) {
                    client.logs.logChannelUpdateName(oldChannel, newChannel);
                }
                if (oldChannel.nsfw !== newChannel.nsfw) {
                    client.logs.logChannelUpdateNSFW(oldChannel, newChannel);
                }
                if (oldChannel.topic !== newChannel.topic) {
                    client.logs.logChannelUpdateTopic(oldChannel, newChannel);
                }
                if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
                    client.logs.logChannelUpdateSlowmode(oldChannel, newChannel);
                }
            }
        } catch (e) {
            logger.error('[ChannelUpdate] Error:', e);
        }
    }
};

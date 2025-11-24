const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelUpdate,
    once: false,

    async execute(oldChannel, newChannel) {
        try {
            const client = newChannel.client;
            logger.info(`✏️ Canal modifié: ${newChannel.name} (${newChannel.id})`);
            if (client.logs) {
                await client.logs.logChannels(newChannel.guild, 'EDIT', { channel: newChannel, before: oldChannel, after: newChannel });
            }
        } catch (e) {
            logger.error('[ChannelUpdate] Error:', e);
        }
    }
};

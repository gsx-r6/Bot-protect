const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelPinsUpdate,
    once: false,

    async execute(channel, time, client) {
        try {
            if (!channel.guild) return;
            logger.info(`📌 Pins mis à jour dans: ${channel.name}`);

            if (client.logs) {
                client.logs.logChannelPinsUpdate(channel);
            }
        } catch (error) {
            logger.error('[ChannelPinsUpdate] Erreur:', error);
        }
    }
};

const { Events } = require('discord.js');
const db = require('../../database/database');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.ChannelCreate,
    once: false,

    async execute(channel, client) {
        if (!channel.guild || !client.muteService) return;

        try {
            const guildConfig = db.getGuildConfig(channel.guild.id);
            if (!guildConfig || !guildConfig.mute_role_id) return;

            const muteRole = channel.guild.roles.cache.get(guildConfig.mute_role_id);
            if (!muteRole) return;

            // Apply restriction if it's not a ticket channel
            await client.muteService.setupChannelPermissions(channel, muteRole);

            logger.info(`[Mute Protection] Applied restrictions to new channel ${channel.name} in ${channel.guild.name}`);
        } catch (error) {
            logger.error(`[ChannelCreate] Error setting up mute perms for ${channel.name}: ${error.message}`);
        }
    }
};

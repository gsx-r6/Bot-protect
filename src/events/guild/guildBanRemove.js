const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildBanRemove,
    once: false,

    async execute(ban, client) {
        try {
            if (!ban.guild) return;
            logger.info(`✅ Membre débanni: ${ban.user.tag} de ${ban.guild.name}`);

            if (client.logs) {
                client.logs.logBanRemove(ban);
            }
        } catch (error) {
            logger.error('[GuildBanRemove] Erreur:', error);
        }
    }
};

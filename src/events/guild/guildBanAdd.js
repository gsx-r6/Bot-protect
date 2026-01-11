const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildBanAdd,
    once: false,

    async execute(ban, client) {
        try {
            if (!ban.guild) return;
            logger.info(`🔨 Membre banni: ${ban.user.tag} de ${ban.guild.name}`);

            if (client.logs) {
                client.logs.logBanAdd(ban);
            }
        } catch (error) {
            logger.error('[GuildBanAdd] Erreur:', error);
        }
    }
};

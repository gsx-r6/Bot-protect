const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,

    async execute(member, client) {
        try {
            logger.info(`➖ Membre parti: ${member.user.tag} de ${member.guild.name}`);

            if (client.logs) {
                client.logs.logMemberLeave(member);
            }

            const statsJob = require('../../jobs/statsVoiceUpdater');
            if (statsJob && statsJob.updateOnce) {
                await statsJob.updateOnce(client, member.guild);
            }

        } catch (error) {
            logger.error('[GuildMemberRemove] Erreur:', error);
        }
    }
};

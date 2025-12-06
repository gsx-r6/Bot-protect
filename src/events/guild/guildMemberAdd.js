const { Events } = require('discord.js');
const logger = require('../../utils/logger');
const AdvancedAntiRaid = require('../../security/advancedAntiRaid');

// Instance globale de l'anti-raid
let antiRaidInstance = null;

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member, client) {
        try {
            logger.info(`➕ Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);

            // Initialiser l'anti-raid si nécessaire
            if (!antiRaidInstance) {
                antiRaidInstance = new AdvancedAntiRaid(client);

                // Nettoyer le cache toutes les minutes
                setInterval(() => antiRaidInstance.cleanup(), 60000);
            }

            // Analyser le membre avec l'anti-raid avancé
            antiRaidInstance.trackJoin(member);
            const wasQuarantined = await antiRaidInstance.analyzeMember(member);

            // Si mis en quarantaine, ne pas continuer
            if (wasQuarantined) {
                logger.warn(`[Anti-Raid] ${member.user.tag} a été mis en quarantaine`);
                return;
            }

            // Logs normaux
            if (client.logs) {
                client.logs.logMember(member.guild, 'JOIN', {
                    user: member.user,
                    memberCount: member.guild.memberCount
                }).catch(() => { });
            }

            if (client.loggerService) {
                client.loggerService.logMemberJoin(member);
            }

            // Mise à jour des stats
            const statsJob = require('../../jobs/statsVoiceUpdater');
            if (statsJob && statsJob.updateOnce) {
                await statsJob.updateOnce(client, member.guild);
            }

        } catch (error) {
            logger.error('[GuildMemberAdd] Erreur:', error);
        }
    }
};

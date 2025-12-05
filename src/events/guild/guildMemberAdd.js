const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    
    async execute(member, client) {
        try {
            logger.info(`➕ Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);
            
            // 📝 Envoyer au canal de logs "member" de manière non-bloquante
            if (client.logs) {
                client.logs.logMember(member.guild, 'JOIN', {
                    user: member.user,
                    memberCount: member.guild.memberCount
                }).catch(e => logger.error('[GuildMemberAdd] Error sending log:', e));
            }
            
            // Mettre à jour les stats
            const statsJob = require('../../jobs/statsVoiceUpdater');
            if (statsJob && statsJob.updateOnce) {
                await statsJob.updateOnce(client, member.guild);
            }
            
        } catch (error) {
            logger.error('[GuildMemberAdd] Erreur:', error);
        }
    }
};

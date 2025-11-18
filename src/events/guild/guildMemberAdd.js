const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    
    async execute(member, client) {
        try {
            logger.info(`➕ Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);
            
            // 📝 Envoyer au canal de logs "member"
            if (client.logs) {
                await client.logs.logMember(member.guild, 'JOIN', {
                    user: member.user,
                    memberCount: member.guild.memberCount
                });
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

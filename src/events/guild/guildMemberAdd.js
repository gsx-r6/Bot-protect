const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const AdvancedAntiRaid = require('../../security/advancedAntiRaid');
const canvasHelper = require('../../utils/canvasHelper');
const db = require('../../database/database');

// Instance globale de l'anti-raid
let antiRaidInstance = null;

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member, client) {
        try {
            logger.info(`➕ Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);

            // 1. ANTI-RAID
            if (!antiRaidInstance) {
                antiRaidInstance = new AdvancedAntiRaid(client);
                setInterval(() => antiRaidInstance.cleanup(), 60000);
            }
            antiRaidInstance.trackJoin(member);
            const wasQuarantined = await antiRaidInstance.analyzeMember(member);
            if (wasQuarantined) {
                logger.warn(`[Anti-Raid] ${member.user.tag} a été mis en quarantaine`);
                return;
            }

            // 2. WELCOME SYSTEM (UHQ)
            // Récupérer la config du serveur
            const config = db.getGuildConfig(member.guild.id);
            // Vérifier si un channel de bienvenue est configuré
            if (config && config.welcome_channel) {
                const welcomeChannel = member.guild.channels.cache.get(config.welcome_channel);
                if (welcomeChannel && welcomeChannel.isTextBased()) {

                    // Générer l'image Canvas
                    const welcomeImageBuffer = await canvasHelper.generateWelcomeImage(member);

                    if (welcomeImageBuffer) {
                        // MODE CANVAS (PREMIUM)
                        const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome.png' });
                        await welcomeChannel.send({
                            content: `Bienvenue ${member} !`,
                            files: [attachment]
                        });
                    } else {
                        // MODE EMBED (FALLBACK / TEXTE)
                        const welcomeEmbed = new EmbedBuilder()
                            .setColor('#00d2ff')
                            .setTitle('👋 Bienvenue !')
                            .setDescription(`Bienvenue **${member.user.username}** sur **${member.guild.name}** !\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
                            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                            .setFooter({ text: 'Amuse-toi bien !' })
                            .setTimestamp();

                        await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
                    }
                }
            }

            // 3. LOGS
            if (client.logs) {
                client.logs.logMember(member.guild, 'JOIN', {
                    user: member.user,
                    memberCount: member.guild.memberCount
                }).catch(() => { });
            }
            if (client.loggerService) {
                client.loggerService.logMemberJoin(member);
            }

            // 4. STATS
            const statsJob = require('../../jobs/statsVoiceUpdater');
            if (statsJob && statsJob.updateOnce) {
                await statsJob.updateOnce(client, member.guild);
            }

        } catch (error) {
            logger.error('[GuildMemberAdd] Erreur:', error);
        }
    }
};

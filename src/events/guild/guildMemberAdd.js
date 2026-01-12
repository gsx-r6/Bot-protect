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

            // 0. ANTI-BOT (Immediate action)
            if (client.antiBot) {
                await client.antiBot.onMemberAdd(member);
                if (member.deleted || !member.guild.members.cache.has(member.id)) return;
            }

            // 1. ANTI-RAID
            if (client.antiRaid) {
                client.antiRaid.trackJoin(member);
                const wasQuarantined = await client.antiRaid.analyzeMember(member);
                if (wasQuarantined) {
                    logger.warn(`[Anti-Raid] ${member.user.tag} a été mis en quarantaine`);
                    return;
                }
            }

            // 1.5 PERSISTENT MUTE RESTORATION
            if (client.muteService) {
                const muteData = db.getPersistentMute(member.guild.id, member.id);
                if (muteData) {
                    logger.info(`[Mute Recovery] Restaurating persistent mute for ${member.user.tag}`);
                    await client.muteService.mute(member, 0, 'Restauration de mute (rejoin)', client.user);
                }
            }

            // 2. VERIFICATION SYSTEM (RESTRICTION)
            if (config && config.verify_channel && config.verify_role_id) {
                const verifyChannel = member.guild.channels.cache.get(config.verify_channel);
                if (verifyChannel) {
                    // Optionnel: On peut envoyer un message de rappel ici ou juste laisser le salon de verif visible
                    // Pour que le membre ne voit que le salon de verif, il faut que les permissions du serveur soient reglées 
                    // de sorte que @everyone n'ait pas accès aux autres salons.
                }
            }

            // 3. WELCOME SYSTEM (UHQ)
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
                client.logs.logMemberJoin(member);
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

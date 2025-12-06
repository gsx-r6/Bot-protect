const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'unlockdown',
    description: 'Déverrouiller le serveur entier',
    category: 'security',
    aliases: ['unlock', 'unlockserver'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    usage: '[raison]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const reason = args.join(' ') || 'Lockdown désactivé par un administrateur';
            const loadingMsg = await message.reply({ embeds: [embeds.info('🔓 Déverrouillage en cours... Restauration des permissions.')] });

            let unlocked = 0;
            let failed = 0;
            const everyoneRole = message.guild.roles.everyone;

            // Déverrouiller tous les salons
            for (const channel of message.guild.channels.cache.values()) {
                if (channel.isTextBased() || channel.isVoiceBased()) {
                    try {
                        await channel.permissionOverwrites.edit(everyoneRole, {
                            SendMessages: null,
                            AddReactions: null,
                            Connect: null,
                            Speak: null
                        }, { reason });
                        unlocked++;
                    } catch (err) {
                        client.logger.error(`[Unlockdown] Erreur salon ${channel.name}:`, err.message);
                        failed++;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔓 Serveur Déverrouillé')
                .setDescription(`Le serveur **${message.guild.name}** a été déverrouillé`)
                .addFields(
                    { name: '✅ Salons déverrouillés', value: `${unlocked}`, inline: true },
                    { name: '❌ Échecs', value: `${failed}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '👮 Par', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`UNLOCKDOWN activated by ${message.author.tag}: ${unlocked} channels unlocked`);

            // Notification dans le salon de logs
            if (client.loggerService) {
                try {
                    await client.loggerService.logSecurity(message.guild, 'UNLOCKDOWN', {
                        moderator: message.author,
                        reason,
                        channelsUnlocked: unlocked,
                        channelsFailed: failed
                    });
                } catch (e) {
                    // Ignore
                }
            }

        } catch (err) {
            client.logger.error('Unlockdown command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du déverrouillage')] });
        }
    }
};

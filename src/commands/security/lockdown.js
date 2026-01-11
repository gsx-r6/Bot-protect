const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'lockdown',
    description: 'Verrouiller le serveur entier (tous les salons en lecture seule)',
    category: 'security',
    aliases: ['lockserver'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    usage: '[raison]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const reason = args.join(' ') || 'Lockdown activé par un administrateur';
            const loadingMsg = await message.reply({ embeds: [embeds.info('🔒 Lockdown en cours... Verrouillage de tous les salons.')] });

            let locked = 0;
            let failed = 0;
            const everyoneRole = message.guild.roles.everyone;

            // Verrouiller tous les salons textuels et vocaux
            for (const channel of message.guild.channels.cache.values()) {
                if (channel.isTextBased() || channel.isVoiceBased()) {
                    try {
                        await channel.permissionOverwrites.edit(everyoneRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Connect: false,
                            Speak: false
                        }, { reason });
                        locked++;
                    } catch (err) {
                        client.logger.error(`[Lockdown] Erreur salon ${channel.name}:`, err.message);
                        failed++;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Serveur Verrouillé')
                .setDescription(`Le serveur **${message.guild.name}** a été mis en lockdown`)
                .addFields(
                    { name: '✅ Salons verrouillés', value: `${locked}`, inline: true },
                    { name: '❌ Échecs', value: `${failed}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '👮 Par', value: message.author.tag, inline: true },
                    { name: '🔓 Déverrouiller', value: 'Utilisez `+unlockdown`', inline: false }
                )
                .setTimestamp();

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`LOCKDOWN activated by ${message.author.tag}: ${locked} channels locked`);

            // Notification dans le salon de logs
            if (client.loggerService) {
                try {
                    await client.loggerService.logSecurity(message.guild, 'LOCKDOWN', {
                        moderator: message.author,
                        reason,
                        channelsLocked: locked,
                        channelsFailed: failed
                    });
                } catch (e) {
                    // Ignore
                }
            }

        } catch (err) {
            client.logger.error('Lockdown command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du lockdown')] });
        }
    }
};

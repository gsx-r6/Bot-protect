const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'report',
    description: 'Envoie un rapport au staff',
    category: 'staff',
    cooldown: 60,
    usage: '[@user] [raison]',
    
    async execute(message, args, client) {
        try {
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un utilisateur.\nUsage: `+report @user Raison du signalement`')] });
            }

            const reason = args.slice(1).join(' ');
            if (!reason) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir une raison.')] });
            }

            const ConfigService = require('../../services/ConfigService');
            const modlogChannel = ConfigService.getModLogChannel(message.guild.id);

            const embed = embeds.info('', '⚠️ Nouveau Signalement', {
                fields: [
                    { name: '👤 Signalé par', value: `${message.author.tag} (${message.author.id})`, inline: false },
                    { name: '🎯 Utilisateur signalé', value: `${target.user.tag} (${target.id})`, inline: false },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '📍 Salon', value: message.channel.toString(), inline: true },
                    { name: '📅 Date', value: new Date().toLocaleString('fr-FR'), inline: true }
                ]
            });

            if (modlogChannel) {
                const channel = message.guild.channels.cache.get(modlogChannel);
                if (channel) {
                    await channel.send({ embeds: [embed] });
                }
            }

            await message.reply({ embeds: [embeds.success('Votre signalement a été envoyé au staff.', 'Signalement envoyé')] });
            await message.delete().catch(() => {});

            client.logger.command(`REPORT: ${target.user.tag} by ${message.author.tag} - ${reason.substring(0, 50)}`);
        } catch (err) {
            client.logger.error('Report command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'envoi du signalement.')] });
        }
    }
};

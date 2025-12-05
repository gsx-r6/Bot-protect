const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setgoodbye',
    description: 'Définir le message d\'au revoir',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[#salon] [message]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un salon.\nUsage: `+setgoodbye #au-revoir Au revoir {user} !`')] });
            }

            const goodbyeMsg = args.slice(1).join(' ') || 'Au revoir {user} !';

            ConfigService.setGoodbyeChannel(message.guild.id, channel.id);
            ConfigService.setGoodbyeMessage(message.guild.id, goodbyeMsg);

            const embed = embeds.success(`Message d'au revoir configuré dans ${channel}`, '👋 Configuration').addFields({ name: 'Message', value: goodbyeMsg });
            await message.reply({ embeds: [embed] });

            client.logger.command(`SETGOODBYE by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setgoodbye command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration du message d\'au revoir.')] });
        }
    }
};

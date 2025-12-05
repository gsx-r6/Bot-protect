const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setverif',
    description: 'Définir le salon de vérification',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[#salon]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un salon.\nUsage: `+setverif #vérification`')] });
            }

            ConfigService.setVerifyChannel(message.guild.id, channel.id);

            const embed = embeds.success(`Salon de vérification configuré: ${channel}`, '✅ Configuration');
            await message.reply({ embeds: [embed] });

            client.logger.command(`SETVERIF by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setverif command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration du salon de vérification.')] });
        }
    }
};

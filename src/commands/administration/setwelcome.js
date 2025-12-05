const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setwelcome',
    description: 'Définir le message de bienvenue',
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
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un salon.\nUsage: `+setwelcome #bienvenue Bienvenue {user} !`\nVariables: {user}, {server}, {count}')] });
            }

            const welcomeMsg = args.slice(1).join(' ') || 'Bienvenue {user} sur {server} !';

            ConfigService.setWelcomeChannel(message.guild.id, channel.id);
            ConfigService.setWelcomeMessage(message.guild.id, welcomeMsg);

            const embed = embeds.success(`Message de bienvenue configuré dans ${channel}`, '👋 Configuration').addFields({ name: 'Message', value: welcomeMsg });
            await message.reply({ embeds: [embed] });

            client.logger.command(`SETWELCOME by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setwelcome command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration du message de bienvenue.')] });
        }
    }
};

const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setprefix',
    description: 'Modifier le préfixe',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[nouveau préfixe]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (!args[0]) {
                const currentPrefix = ConfigService.getPrefix(message.guild.id);
                return message.reply({ embeds: [embeds.info(`Préfixe actuel: \`${currentPrefix}\``, '⚙️ Préfixe').addFields({ name: 'Usage', value: '`+setprefix <nouveau préfixe>`' })] });
            }

            const newPrefix = args[0];
            if (newPrefix.length > 5) {
                return message.reply({ embeds: [embeds.error('Le préfixe ne peut pas dépasser 5 caractères.')] });
            }

            ConfigService.setPrefix(message.guild.id, newPrefix);

            const embed = embeds.success(`Préfixe changé en: \`${newPrefix}\``, '⚙️ Configuration');
            await message.reply({ embeds: [embed] });

            client.logger.command(`SETPREFIX: ${newPrefix} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setprefix command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du changement de préfixe.')] });
        }
    }
};

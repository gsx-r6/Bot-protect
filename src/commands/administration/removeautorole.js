const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'removeautorole',
    description: 'Supprimer l\'auto-rôle',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            ConfigService.setAutorole(message.guild.id, null);

            const embed = embeds.success('Auto-rôle désactivé', '🎭 Configuration');
            await message.reply({ embeds: [embed] });

            client.logger.command(`REMOVEAUTOROLE by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Removeautorole command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la suppression de l\'auto-rôle.')] });
        }
    }
};

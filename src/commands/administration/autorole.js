const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'autorole',
    description: 'Donner automatiquement un rôle aux nouveaux',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 5,
    usage: '[@rôle]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const role = message.mentions.roles.first();
            if (!role) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un rôle.\nUsage: `+autorole @Membre`')] });
            }

            if (role.position >= message.guild.members.me.roles.highest.position) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas gérer ce rôle (position trop haute).')] });
            }

            ConfigService.setAutorole(message.guild.id, role.id);

            const embed = embeds.success(`Auto-rôle configuré: ${role}`, '🎭 Configuration').addFields({ name: 'Info', value: 'Les nouveaux membres recevront automatiquement ce rôle.' });
            await message.reply({ embeds: [embed] });

            client.logger.command(`AUTOROLE: ${role.name} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Autorole command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration de l\'auto-rôle.')] });
        }
    }
};

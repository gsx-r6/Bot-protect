const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'verify',
    description: 'Vérification manuelle d\'un membre',
    category: 'security',
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 3,
    usage: '[@user]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre à vérifier.')] });
            }

            const ConfigService = require('../../services/ConfigService');
            const autoroleId = ConfigService.getAutorole(message.guild.id);

            if (!autoroleId) {
                return message.reply({ embeds: [embeds.error('Aucun rôle de vérification configuré. Utilisez `+autorole @role`')] });
            }

            const role = message.guild.roles.cache.get(autoroleId);
            if (!role) {
                return message.reply({ embeds: [embeds.error('Le rôle de vérification n\'existe plus.')] });
            }

            if (target.roles.cache.has(autoroleId)) {
                return message.reply({ embeds: [embeds.error('Ce membre est déjà vérifié.')] });
            }

            await target.roles.add(role);
            
            const embed = embeds.success(`${target.user.tag} a été vérifié avec succès !`, '✅ Vérification');
            await message.reply({ embeds: [embed] });

            client.logger.command(`VERIFY: ${target.user.tag} by ${message.author.tag}`);
        } catch (err) {
            client.logger.error('Verify command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la vérification.')] });
        }
    }
};

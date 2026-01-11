const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');

module.exports = {
    name: 'setperm',
    description: 'Ajouter ou retirer un rôle d\'un niveau de permission',
    category: 'administration',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    usage: '<add|remove|clear> <niveau (1-11)> <@role>',
    
    async execute(message, args, client) {
        try {
            const action = args[0]?.toLowerCase();
            const level = parseInt(args[1]);
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

            if (!['add', 'remove', 'clear'].includes(action)) {
                return message.reply({ embeds: [embeds.error('Action invalide (add, remove, clear).')] });
            }

            if (isNaN(level) || level < 1 || level > 11) {
                return message.reply({ embeds: [embeds.error('Niveau invalide (doit être entre 1 et 11).')] });
            }

            if (action === 'clear') {
                db.clearPermissionLevel(message.guild.id, level);
                return message.reply({ embeds: [embeds.success(`Tous les rôles du niveau **${level}** ont été supprimés.`)] });
            }

            if (!role) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un rôle.')] });
            }

            if (action === 'add') {
                db.addPermissionLevel(message.guild.id, level, role.id);
                return message.reply({ embeds: [embeds.success(`Le rôle ${role} a été ajouté au niveau **${level}**.`)] });
            } else if (action === 'remove') {
                db.removePermissionLevel(message.guild.id, level, role.id);
                return message.reply({ embeds: [embeds.success(`Le rôle ${role} a été retiré du niveau **${level}**.`)] });
            }

        } catch (err) {
            client.logger.error('Setperm error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des permissions.')] });
        }
    }
};

const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'stafflist',
    description: 'Liste des membres du staff',
    category: 'staff',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const staff = message.guild.members.cache.filter(m => 
                m.permissions.has('ManageMessages') || 
                m.permissions.has('KickMembers') || 
                m.permissions.has('BanMembers') ||
                m.permissions.has('Administrator')
            );

            const admins = staff.filter(m => m.permissions.has('Administrator'));
            const mods = staff.filter(m => !m.permissions.has('Administrator') && m.permissions.has('BanMembers'));
            const helpers = staff.filter(m => !m.permissions.has('Administrator') && !m.permissions.has('BanMembers') && m.permissions.has('ManageMessages'));

            const embed = embeds.info('', `👥 Staff de ${message.guild.name}`, {
                fields: [
                    { name: '👑 Administrateurs', value: admins.map(m => m.user.tag).join('\n') || 'Aucun', inline: false },
                    { name: '🛡️ Modérateurs', value: mods.map(m => m.user.tag).join('\n') || 'Aucun', inline: false },
                    { name: '🆘 Helpers', value: helpers.map(m => m.user.tag).join('\n') || 'Aucun', inline: false },
                    { name: '📊 Total', value: `${staff.size} membres du staff`, inline: true }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Stafflist command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage de la liste du staff.')] });
        }
    }
};

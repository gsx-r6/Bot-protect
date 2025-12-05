const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'checkperms',
    description: 'Vérifie les permissions d\'un membre',
    category: 'security',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[@user]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const target = message.mentions.members.first() || message.member;
            const perms = target.permissions.toArray();

            const dangerousPerms = ['Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers', 'ManageWebhooks'];
            const hasDangerous = perms.filter(p => dangerousPerms.includes(p));

            const embed = embeds.info('', `🔐 Permissions de ${target.user.tag}`, {
                fields: [
                    { name: '⚠️ Permissions sensibles', value: hasDangerous.length > 0 ? hasDangerous.join(', ') : 'Aucune', inline: false },
                    { name: '📋 Toutes les permissions', value: perms.slice(0, 10).join(', ') + (perms.length > 10 ? `... (+${perms.length - 10})` : ''), inline: false },
                    { name: '🎭 Rôles', value: `${target.roles.cache.size} rôles`, inline: true }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Checkperms command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la vérification des permissions.')] });
        }
    }
};

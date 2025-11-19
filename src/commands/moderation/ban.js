const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const { validatePermissions } = require('../../handlers/permissionHandler');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'ban',
    description: 'Bannir un membre du serveur',
    category: 'moderation',
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 3,
    async execute(message, args, client) {
        try {
            const SPECIAL_BAN_ROLE = '1434622699547656295';
            const HIGH_ROLE_THRESHOLD = '1434622694481072130';
            const PERM_7_ROLES = ['1434622709513588826', '1434622705436459079', '1434622704413048852', '1434622698721509579', '1434622696716636184'];
            const PERM_10_ROLES = ['1434622699547656295', '1434622680455184395', '1434622675266830610'];

            const hasSpecialRole = message.member.roles.cache.has(SPECIAL_BAN_ROLE);
            const highRoleThreshold = message.guild.roles.cache.get(HIGH_ROLE_THRESHOLD);
            const isAboveThreshold = highRoleThreshold && message.member.roles.highest.position > highRoleThreshold.position;
            
            const hasPerm7to10 = message.member.roles.cache.some(role => 
                PERM_7_ROLES.includes(role.id) || PERM_10_ROLES.includes(role.id)
            );

            if (!hasSpecialRole && !isAboveThreshold && !hasPerm7to10) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de ban. Cette commande est réservée aux rôles Perm 7 et supérieurs.')] });
            }

            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });

            const target = await resolveMember(message.guild, args[0]);
            if (!target) return message.reply({ embeds: [embeds.error('Membre introuvable.')] });

            const { canModerate, reason } = await validatePermissions(message.member, target, message.guild.members.me);
            if (!canModerate) return message.reply({ embeds: [embeds.error(reason || 'Impossible de modérer ce membre')] });

            const banReason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

            await target.ban({ reason: `${banReason} — par ${message.author.tag}` });

            // Log vers LogService
            if (client.logs) {
                await client.logs.logModeration(message.guild, 'BAN', {
                    user: target.user,
                    moderator: message.author,
                    reason: banReason
                });
            }

            await message.reply({ embeds: [embeds.success(`${target.user.tag} a été banni.`, 'Action: Ban').addFields({ name: 'Raison', value: banReason }, { name: 'Modérateur', value: message.author.tag })] });

            client.logger.command(`BAN: ${target.user.tag} by ${message.author.tag} in ${message.guild.id} - ${banReason}`);
        } catch (err) {
            client.logger.error('Error in ban command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du bannissement.')] });
        }
    }
};

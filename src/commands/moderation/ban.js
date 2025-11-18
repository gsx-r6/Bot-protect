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

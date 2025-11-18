const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const { validatePermissions } = require('../../handlers/permissionHandler');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'kick',
    description: 'Expulser un membre du serveur',
    category: 'moderation',
    permissions: [PermissionFlagsBits.KickMembers],
    cooldown: 3,
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });

            const target = await resolveMember(message.guild, args[0]);
            if (!target) return message.reply({ embeds: [embeds.error('Membre introuvable.')] });

            const { canModerate, reason } = await validatePermissions(message.member, target, message.guild.members.me);
            if (!canModerate) return message.reply({ embeds: [embeds.error(reason || 'Impossible de modérer ce membre')] });

            const kickReason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

            await target.kick(kickReason);

            // Log vers LogService
            if (client.logs) {
                await client.logs.logModeration(message.guild, 'KICK', {
                    user: target.user,
                    moderator: message.author,
                    reason: kickReason
                });
            }

            await message.reply({ embeds: [embeds.success(`${target.user.tag} a été expulsé.`, 'Action: Kick').addFields({ name: 'Raison', value: kickReason }, { name: 'Modérateur', value: message.author.tag })] });

            client.logger.command(`KICK: ${target.user.tag} by ${message.author.tag} in ${message.guild.id} - ${kickReason}`);
        } catch (err) {
            client.logger.error('Error in kick command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'expulsion.')] });
        }
    }
};

const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const { validatePermissions } = require('../../handlers/permissionHandler');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'mute',
    description: 'Rendre muet un membre (timeout)',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });

            const target = await resolveMember(message.guild, args[0]);
            if (!target) return message.reply({ embeds: [embeds.error('Membre introuvable.')] });

            const { canModerate, reason } = await validatePermissions(message.member, target, message.guild.members.me);
            if (!canModerate) return message.reply({ embeds: [embeds.error(reason || 'Impossible de modérer ce membre')] });

            const durationArg = args[1] || '60m';
            const durationMs = parseDuration(durationArg);
            if (!durationMs || durationMs <= 0) return message.reply({ embeds: [embeds.error('Durée invalide. Exemples: 10s, 5m, 2h')] });

            const reasonText = args.slice(2).join(' ') || 'Aucune raison spécifiée';

            await target.timeout(durationMs, `${reasonText} — par ${message.author.tag}`);

            // Log vers LogService
            if (client.logs) {
                await client.logs.logModeration(message.guild, 'MUTE', {
                    user: target.user,
                    moderator: message.author,
                    reason: reasonText,
                    duration: durationArg
                });
            }

            await message.reply({ embeds: [embeds.success(`${target.user.tag} a été rendu muet pour ${durationArg}.`, 'Action: Mute').addFields({ name: 'Raison', value: reasonText }, { name: 'Durée', value: durationArg })] });

            client.logger.command(`MUTE: ${target.user.tag} by ${message.author.tag} in ${message.guild.id} - ${durationArg} - ${reasonText}`);
        } catch (err) {
            client.logger.error('Error in mute command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du mute.')] });
        }
    }
};

function parseDuration(duration) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = /^([0-9]+)([smhd])$/.exec(duration);
    if (!match) return null;
    return parseInt(match[1], 10) * (units[match[2]] || 0);
}

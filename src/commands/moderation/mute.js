const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const PermissionHandler = require('../../utils/PermissionHandler');
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

            // Vérification du Rate Limit
            if (!PermissionHandler.checkRateLimit(message.member, 'mute')) {
                const remaining = PermissionHandler.getRemainingUses(message.member, 'mute');
                return message.reply({ embeds: [embeds.error(`Vous avez atteint votre limite de mutes pour cette heure.\nRestant: ${remaining}`)] });
            }

            let targetUser = message.mentions.users.first();
            if (!targetUser && args[0]) {
                try {
                    targetUser = await client.users.fetch(args[0]);
                } catch (e) { }
            }

            if (!targetUser) return message.reply({ embeds: [embeds.error('Membre introuvable (Mention ou ID).')] });

            const target = await message.guild.members.fetch(targetUser.id).catch(() => null);
            if (!target) return message.reply({ embeds: [embeds.error('Ce membre n\'est pas sur le serveur.')] });

            // Vérification de la Hiérarchie
            if (!PermissionHandler.checkHierarchy(message.member, target)) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas sanctionner ce membre car il est supérieur ou égal à vous dans la hiérarchie du bot.')] });
            }

            if (!target.moderatable) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas rendre muet ce membre.')] });
            }

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

            const remaining = PermissionHandler.getRemainingUses(message.member, 'mute');
            await message.reply({
                embeds: [embeds.success(`${target.user.tag} a été rendu muet pour ${durationArg}.`, 'Action: Mute').addFields(
                    { name: 'Raison', value: reasonText },
                    { name: 'Durée', value: durationArg },
                    { name: 'Quota restant', value: `${remaining}` }
                )]
            });

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

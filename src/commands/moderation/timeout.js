const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const PermissionHandler = require('../../utils/PermissionHandler');

module.exports = {
    name: 'timeout',
    description: 'Restreindre temporairement un membre',
    category: 'moderation',
    aliases: ['to'],
    cooldown: 3,
    usage: '<@membre> <durée> [raison]',
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de timeout des membres.')] });
            }

            // Vérification du Rate Limit
            if (!PermissionHandler.checkRateLimit(message.member, 'mute')) { // Timeout = Mute limit
                const remaining = PermissionHandler.getRemainingUses(message.member, 'mute');
                return message.reply({ embeds: [embeds.error(`Vous avez atteint votre limite de timeouts pour cette heure.\nRestant: ${remaining}`)] });
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

            const duration = args[1];
            if (!duration) {
                return message.reply({ embeds: [embeds.error('Veuillez spécifier une durée (ex: 10m, 1h, 1d).')] });
            }

            const ms = parseDuration(duration);
            if (!ms || ms > 28 * 24 * 60 * 60 * 1000) {
                return message.reply({ embeds: [embeds.error('Durée invalide. Max: 28 jours. Format: 10m, 1h, 1d.')] });
            }

            const reason = args.slice(2).join(' ') || 'Aucune raison fournie';
            const auditReason = `[🛡️ UHQ MODERATION] ${reason} — par ${message.author.tag}`;

            await target.timeout(ms, auditReason);

            // Log vers LogService
            try {
                if (client.logs) {
                    await client.logs.logModeration(message.guild, 'TIMEOUT', {
                        user: target.user,
                        moderator: message.author,
                        reason,
                        duration
                    });
                }
            } catch (e) {
                client.logger.error('[timeout] Error sending log:', e);
            }

            const embed = embeds.moderation(
                `✅ **Membre mis en timeout avec succès**\n\n` +
                `**Membre:** ${target.user.tag}\n` +
                `**Durée:** ${duration}\n` +
                `**Raison:** ${reason}\n` +
                `**Modérateur:** ${message.author}`,
                '⏱️ Timeout'
            );

            await message.reply({ embeds: [embed] });

            try {
                await target.send({
                    embeds: [embeds.warn(
                        `Vous avez été mis en timeout sur **${message.guild.name}**\n\n` +
                        `**Durée:** ${duration}\n` +
                        `**Raison:** ${reason}`,
                        '⏱️ Timeout'
                    )]
                });
            } catch (e) {
                // Impossible d'envoyer un MP
            }

        } catch (error) {
            client.logger.error('Erreur timeout:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

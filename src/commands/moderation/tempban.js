const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const PermissionHandler = require('../../utils/PermissionHandler');

module.exports = {
    name: 'tempban',
    description: 'Bannir temporairement un membre',
    category: 'moderation',
    aliases: ['tban'],
    cooldown: 5,
    usage: '<@membre> <durée> [raison]',
    permissions: [PermissionsBitField.Flags.BanMembers],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de bannir des membres.')] });
            }

            // Vérification du Rate Limit
            if (!PermissionHandler.checkRateLimit(message.member, 'ban')) {
                const remaining = PermissionHandler.getRemainingUses(message.member, 'ban');
                return message.reply({ embeds: [embeds.error(`Vous avez atteint votre limite de bans pour cette heure.\nRestant: ${remaining}`)] });
            }

            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre à bannir temporairement.')] });
            }

            // Vérification de la Hiérarchie
            if (!PermissionHandler.checkHierarchy(message.member, target)) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas sanctionner ce membre car il est supérieur ou égal à vous dans la hiérarchie.')] });
            }

            const duration = args[1];
            if (!duration) {
                return message.reply({ embeds: [embeds.error('Veuillez spécifier une durée (ex: 1h, 1d, 7d).')] });
            }

            const ms = parseDuration(duration);
            if (!ms) {
                return message.reply({ embeds: [embeds.error('Durée invalide. Format: 1h, 1d, 7d.')] });
            }

            const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

            try {
                await target.send({
                    embeds: [embeds.warn(
                        `Vous avez été banni temporairement de **${message.guild.name}**\n\n` +
                        `**Durée:** ${duration}\n` +
                        `**Raison:** ${reason}\n\n` +
                        `Vous pourrez revenir après cette période.`,
                        '🔨 Bannissement temporaire'
                    )]
                });
            } catch (e) {
                // Impossible d'envoyer un MP
            }

            await target.ban({ reason: `[TEMPBAN ${duration}] ${reason} | Par: ${message.author.tag}`, deleteMessageSeconds: 86400 });

            // Log vers LogService
            try {
                if (client.logs) {
                    await client.logs.logModeration(message.guild, 'TEMPBAN', {
                        user: target.user,
                        moderator: message.author,
                        reason,
                        duration
                    });
                }
            } catch (e) {
                client.logger.error('[tempban] Error sending log:', e);
            }

            setTimeout(async () => {
                try {
                    await message.guild.members.unban(target.id, `Tempban expiré (${duration})`);
                } catch (e) {
                    client.logger.error('Erreur unban automatique:', e);
                }
            }, ms);

            const embed = embeds.moderation(
                `✅ **Membre banni temporairement avec succès**\n\n` +
                `**Membre:** ${target.user.tag}\n` +
                `**Durée:** ${duration}\n` +
                `**Raison:** ${reason}\n` +
                `**Modérateur:** ${message.author}`,
                '🔨 Bannissement temporaire'
            );

            await message.reply({ embeds: [embed] });

        } catch (error) {
            client.logger.error('Erreur tempban:', error);
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

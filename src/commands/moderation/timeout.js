const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const permHandler = require('../../handlers/permissionHandler');

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
            
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre à timeout.')] });
            }
            
            const permCheck = permHandler.canModerate(message.member, target, message.guild);
            if (!permCheck.allowed) {
                return message.reply({ embeds: [embeds.error(permCheck.reason)] });
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
            
            await target.timeout(ms, `${reason} | Par: ${message.author.tag}`);

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
                await target.send({ embeds: [embeds.warn(
                    `Vous avez été mis en timeout sur **${message.guild.name}**\n\n` +
                    `**Durée:** ${duration}\n` +
                    `**Raison:** ${reason}`,
                    '⏱️ Timeout'
                )] });
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

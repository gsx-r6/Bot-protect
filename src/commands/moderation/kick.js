const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const PermissionHandler = require('../../utils/PermissionHandler');
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

            // Vérification du Rate Limit
            if (!PermissionHandler.checkRateLimit(message.member, 'kick')) {
                const remaining = PermissionHandler.getRemainingUses(message.member, 'kick');
                return message.reply({ embeds: [embeds.error(`Vous avez atteint votre limite d'expulsions pour cette heure.\nRestant: ${remaining}`)] });
            }

            let targetUser = message.mentions.users.first();
            if (!targetUser && args[0]) {
                try {
                    targetUser = await client.users.fetch(args[0]);
                } catch (e) { }
            }

            if (!targetUser) return message.reply({ embeds: [embeds.error('Membre introuvable (Mention ou ID).')] });

            // Pour Kick il FAUT que le membre soit dans le serveur
            const target = await message.guild.members.fetch(targetUser.id).catch(() => null);
            if (!target) return message.reply({ embeds: [embeds.error('Ce membre n\'est pas sur le serveur.')] });

            // Vérification de la Hiérarchie
            if (!PermissionHandler.checkHierarchy(message.member, target)) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas sanctionner ce membre car il est supérieur ou égal à vous dans la hiérarchie du bot.')] });
            }

            if (!target.kickable) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas expulser ce membre.')] });
            }

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

            const remaining = PermissionHandler.getRemainingUses(message.member, 'kick');
            await message.reply({
                embeds: [embeds.success(`${target.user.tag} a été expulsé.`, 'Action: Kick').addFields(
                    { name: 'Raison', value: kickReason },
                    { name: 'Modérateur', value: message.author.tag },
                    { name: 'Quota restant', value: `${remaining}` }
                )]
            });

            client.logger.command(`KICK: ${target.user.tag} by ${message.author.tag} in ${message.guild.id} - ${kickReason}`);
        } catch (err) {
            client.logger.error('Error in kick command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'expulsion.')] });
        }
    }
};

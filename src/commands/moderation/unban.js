const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Débannir un utilisateur',
    category: 'moderation',
    aliases: ['pardon'],
    cooldown: 3,
    usage: '<userID> [raison]',
    permissions: [PermissionsBitField.Flags.BanMembers],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de débannir des membres.')] });
            }

            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply({ embeds: [embeds.error('Je n\'ai pas la permission de débannir des membres.')] });
            }

            const userId = args[0];
            if (!userId) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID de l\'utilisateur à débannir.')] });
            }

            const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

            // Vérifier si l'utilisateur est banni avant de tenter de le débannir
            try {
                // Récupérer le cache des bans
                const banList = await message.guild.bans.fetch();
                const bannedUser = banList.get(userId);

                if (!bannedUser) {
                    return message.reply({ embeds: [embeds.error('Cet utilisateur n\'est pas banni.')] });
                }

                await message.guild.members.unban(userId, `${reason} | Par: ${message.author.tag}`);

                // Log vers LogService
                try {
                    if (client.logs) {
                        await client.logs.logModeration(message.guild, 'UNBAN', {
                            user: { id: userId, tag: bannedUser.user.tag }, // Enrichir avec le tag si possible
                            moderator: message.author,
                            reason
                        });
                    }
                } catch (e) {
                    client.logger.error('[unban] Error sending log:', e);
                }

                const embed = embeds.moderation(
                    `✅ **Utilisateur débanni avec succès**\n\n` +
                    `**Utilisateur:** ${bannedUser.user.tag} (\`${userId}\`)\n` +
                    `**Raison:** ${reason}\n` +
                    `**Modérateur:** ${message.author}`,
                    '🔓 Débannissement'
                );

                await message.reply({ embeds: [embed] });

            } catch (err) {
                client.logger.error('Erreur unban:', err);
                return message.reply({ embeds: [embeds.error('Une erreur est survenue ou l\'ID est invalide.')] });
            }

        } catch (error) {
            client.logger.error('Erreur unban:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

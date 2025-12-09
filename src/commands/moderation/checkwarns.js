const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    name: 'checkwarns',
    description: 'Affiche les membres ayant plusieurs avertissements',
    category: 'moderation',
    aliases: ['warnlist'],
    cooldown: 5,
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de voir cette liste.')] });
            }

            let targetUserId = message.author.id;

            if (args[0]) {
                const mention = message.mentions.users.first();
                if (mention) targetUserId = mention.id;
                else if (args[0].match(/^\d+$/)) targetUserId = args[0];
            }

            const allWarnings = db.db.prepare('SELECT user_id, COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?').get(message.guild.id, targetUserId);

            // Si on demande pour un user spécifique (args[0]), on montre ses warns
            if (args[0]) {
                const userWarnings = db.getWarnings(message.guild.id, targetUserId);
                if (!userWarnings || userWarnings.length === 0) {
                    return message.reply({ embeds: [embeds.info(`Aucun avertissement pour cet utilisateur.`, '📋 Historique')] });
                }

                const list = userWarnings.map((w, i) => `**${i + 1}.** ${w.reason} - <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R> par <@${w.moderator_id}>`).join('\n');

                const embed = embeds.moderation('', `⚠️ Avertissements de ${targetUserId}`, {
                    description: list
                });
                return message.reply({ embeds: [embed] });
            }

            // Comportement par défaut (Liste globale ou top) - Conserver le comportement original si pas d'args mais modifié pour "Top Warns"
            const topWarnings = db.db.prepare('SELECT user_id, COUNT(*) as count FROM warnings WHERE guild_id = ? GROUP BY user_id HAVING count > 0 ORDER BY count DESC LIMIT 15').all(message.guild.id);

            if (!allWarnings || allWarnings.length === 0) {
                return message.reply({ embeds: [embeds.info('Aucun membre avec des avertissements sur ce serveur.', '📋 Liste des avertissements')] });
            }

            const fields = [];
            for (const data of allWarnings) {
                try {
                    const user = await client.users.fetch(data.user_id).catch(() => null);
                    const username = user ? user.tag : `ID: ${data.user_id}`;
                    fields.push({
                        name: `${username}`,
                        value: `**${data.count}** avertissement(s)`,
                        inline: true
                    });
                } catch (e) {
                    fields.push({
                        name: `ID: ${data.user_id}`,
                        value: `**${data.count}** avertissement(s)`,
                        inline: true
                    });
                }
            }

            const embed = embeds.moderation('', '⚠️ Membres avec avertissements', {
                fields: fields.slice(0, 15)
            });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            client.logger.error('Erreur checkwarns:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

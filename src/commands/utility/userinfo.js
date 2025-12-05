const { EmbedBuilder } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'userinfo',
    description: 'Affiche les informations sur un membre',
    category: 'information',
    async execute(message, args, client) {
        try {
            const target = (await resolveMember(message.guild, args[0])) || message.member;
            const user = target.user;

            const embed = new EmbedBuilder()
                .setColor(client.config.EMBED_COLOR || '#FF69B4')
                .setTitle(`👤 Informations sur ${user.tag} - Nami Protect ⚡`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '📛 Pseudonyme', value: `${user.tag}`, inline: true },
                    { name: '🆔 ID', value: user.id, inline: true },
                    { name: '📅 Compte créé', value: `${user.createdAt.toLocaleDateString('fr-FR')}`, inline: true },
                    { name: '🔗 Serveur rejoint', value: `${target.joinedAt?.toLocaleDateString('fr-FR') || 'Inconnu'}`, inline: true },
                    { name: '🎭 Rôles', value: `${target.roles.cache.size - 1} rôles`, inline: true }
                )
                .setFooter({ text: `Demandé par ${message.author.tag}` });

            await message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Error in userinfo: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération des informations.')] });
        }
    }
};

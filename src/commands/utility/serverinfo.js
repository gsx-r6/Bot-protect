const { EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'serverinfo',
    description: 'Affiche les informations du serveur',
    category: 'information',
    async execute(message, args, client) {
        try {
            const guild = message.guild;
            const owner = await guild.fetchOwner();

            // Attempt to fetch members to provide accurate online/voice counts.
            // This may be heavy for very large guilds; if it fails we fallback to cached/memberCount values.
            let onlineCount = 0;
            let voiceCount = 0;
            try {
                await guild.members.fetch();
                onlineCount = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
                voiceCount = guild.members.cache.filter(m => m.voice && m.voice.channel).size;
            } catch (e) {
                // Fallback: use presence info from cache or 0 if unavailable
                onlineCount = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size || 0;
                // Voice count fallback: count members in voice channels via channel caches
                voiceCount = guild.channels.cache
                    .filter(c => c.isVoiceBased && c.members)
                    .reduce((acc, ch) => acc + ch.members.size, 0);
            }

            const embed = new EmbedBuilder()
                .setColor(client.config.EMBED_COLOR || '#FF69B4')
                .setTitle(`🏠 Informations du serveur - ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '📛 Nom', value: guild.name, inline: true },
                    { name: '🆔 ID', value: guild.id, inline: true },
                    { name: '👑 Propriétaire', value: `${owner.user.tag}`, inline: true },
                    { name: '📅 Créé le', value: `${guild.createdAt.toLocaleDateString('fr-FR')}`, inline: true },
                    { name: '👥 Membres (total)', value: `${guild.memberCount} membres`, inline: true },
                    { name: '🟢 Membres en ligne', value: `${onlineCount}`, inline: true },
                    { name: '🔊 En vocal', value: `${voiceCount}`, inline: true },
                    { name: '🎭 Rôles', value: `${guild.roles.cache.size} rôles`, inline: true }
                )
                .setFooter({ text: 'Nami Protect ⚡' });

            await message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Error in serverinfo: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération des informations du serveur.')] });
        }
    }
};

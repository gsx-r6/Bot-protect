const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'ticketstats',
    description: 'Afficher les statistiques détaillées des tickets',
    category: 'administration',
    aliases: ['tstats', 'ticketstatistics'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '',

    async execute(message, args, client) {
        try {
            const guildId = message.guild.id;
            const color = ConfigService.getEmbedColor(guildId);
            const stats = db.getTicketStats(guildId);
            const openTickets = db.getAllOpenTickets(guildId);

            // Statistiques avancées
            const ticketConfig = db.getTicketConfig(guildId) || {};
            const staffRole = ticketConfig.staff_role ? message.guild.roles.cache.get(ticketConfig.staff_role) : null;

            // Calculer les tickets par statut
            const claimedCount = openTickets.filter(t => t.claimed_by).length;
            const unclaimedCount = openTickets.length - claimedCount;

            // Top 5 créateurs de tickets
            const allTickets = db.db.prepare('SELECT owner, COUNT(*) as count FROM tickets WHERE guild = ? GROUP BY owner ORDER BY count DESC LIMIT 5').all(guildId);
            const topCreators = allTickets.map((t, i) => {
                const user = message.guild.members.cache.get(t.owner);
                return `**${i + 1}.** ${user ? user.user.tag : 'Utilisateur inconnu'} - ${t.count} ticket(s)`;
            }).join('\n') || 'Aucune donnée';

            // Tickets récents (dernières 24h)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const recentTickets = db.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild = ? AND created_at > ?').get(guildId, oneDayAgo);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('📊 Statistiques des Tickets')
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .addFields(
                    {
                        name: '📈 Vue d\'ensemble',
                        value: [
                            `**Total:** ${stats.total}`,
                            `**Ouverts:** ${stats.open} 🟢`,
                            `**Fermés:** ${stats.closed} 🔴`,
                            `**Dernières 24h:** ${recentTickets.count}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎯 Tickets ouverts',
                        value: [
                            `**Pris en charge:** ${claimedCount} ✋`,
                            `**En attente:** ${unclaimedCount} ⏳`,
                            `**Taux de prise en charge:** ${stats.open > 0 ? Math.round((claimedCount / stats.open) * 100) : 0}%`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚙️ Configuration',
                        value: [
                            `**Rôle Staff:** ${staffRole ? staffRole.toString() : 'Non configuré'}`,
                            `**Limite par user:** ${ticketConfig.max_tickets || 1}`,
                            `**Transcripts:** ${ticketConfig.transcript_enabled ? '✅ Activés' : '❌ Désactivés'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🏆 Top Créateurs',
                        value: topCreators,
                        inline: false
                    }
                )
                .setFooter({ text: `${message.guild.name} • Système de Tickets`, iconURL: message.guild.iconURL() })
                .setTimestamp();

            // Ajouter la liste des tickets ouverts si pas trop nombreux
            if (openTickets.length > 0 && openTickets.length <= 10) {
                const ticketList = openTickets.map((t, i) => {
                    const channel = message.guild.channels.cache.get(t.channel);
                    const claimed = t.claimed_by ? '✋' : '⏳';
                    const created = new Date(t.created_at);
                    return `${claimed} ${channel ? channel.toString() : 'Canal supprimé'} - <t:${Math.floor(created.getTime() / 1000)}:R>`;
                }).join('\n');

                embed.addFields({
                    name: `📋 Tickets ouverts (${openTickets.length})`,
                    value: ticketList,
                    inline: false
                });
            } else if (openTickets.length > 10) {
                embed.addFields({
                    name: `📋 Tickets ouverts`,
                    value: `Il y a actuellement **${openTickets.length}** tickets ouverts. Trop nombreux pour être affichés ici.`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
            client.logger.command(`TICKETSTATS viewed by ${message.author.tag} in ${message.guild.name}`);

        } catch (err) {
            client.logger.error('Ticketstats command error: ' + err.stack);
            return message.reply({ content: '❌ Erreur lors de la récupération des statistiques.' });
        }
    }
};

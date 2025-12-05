const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'dashboard',
    description: 'Afficher le panel de contrôle complet du serveur',
    category: 'administration',
    aliases: ['panel', 'control'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    usage: '',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const guildId = message.guild.id;
            const guild = message.guild;
            const guildConfig = ConfigService.getGuildConfig(guildId) || {};
            const automodConfig = AutomodService.getConfig(guildId);
            const color = ConfigService.getEmbedColor(guildId);
            const prefix = ConfigService.getPrefix(guildId);

            const memberCount = guild.memberCount;
            const onlineCount = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;
            const channelCount = guild.channels.cache.size;
            const roleCount = guild.roles.cache.size;

            const securityScore = [
                automodConfig.antispam,
                automodConfig.antilink,
                automodConfig.antiflood,
                automodConfig.antimention,
                automodConfig.antijoinraid,
                automodConfig.antinuke,
                automodConfig.antiedit,
                automodConfig.antibot
            ].filter(Boolean).length;

            const securityPercent = Math.round((securityScore / 8) * 100);
            const securityEmoji = securityPercent >= 75 ? '🟢' : securityPercent >= 50 ? '🟡' : '🔴';

            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({ name: `Dashboard de ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setDescription(`**Panel de contrôle et statistiques du serveur**`)
                .addFields(
                    {
                        name: '📊 Statistiques du Serveur',
                        value: [
                            `👥 **Membres:** ${memberCount} (${onlineCount} en ligne)`,
                            `🤖 **Bots:** ${botCount}`,
                            `📺 **Salons:** ${channelCount}`,
                            `🎭 **Rôles:** ${roleCount}`,
                            `👑 **Propriétaire:** <@${guild.ownerId}>`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚙️ Configuration',
                        value: [
                            `**Préfixe:** \`${prefix}\``,
                            `**Couleur:** \`${color}\``,
                            `**Auto-rôle:** ${guildConfig.autorole_id ? '✅' : '❌'}`,
                            `**Bienvenue:** ${guildConfig.welcome_channel ? '✅' : '❌'}`,
                            `**Logs:** ${guildConfig.log_channel ? '✅' : '❌'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: `🛡️ Sécurité ${securityEmoji} (${securityPercent}%)`,
                        value: [
                            `${automodConfig.antispam ? '✅' : '❌'} Anti-Spam`,
                            `${automodConfig.antilink ? '✅' : '❌'} Anti-Link`,
                            `${automodConfig.antiflood ? '✅' : '❌'} Anti-Flood`,
                            `${automodConfig.antimention ? '✅' : '❌'} Anti-Mention`,
                            `${automodConfig.antijoinraid ? '✅' : '❌'} Anti-JoinRaid`,
                            `${automodConfig.antinuke ? '✅' : '❌'} Anti-Nuke`,
                            `${automodConfig.antiedit ? '✅' : '❌'} Anti-Edit`,
                            `${automodConfig.antibot ? '✅' : '❌'} Anti-Bot`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📝 Logs Actifs',
                        value: 'Utilisez `+logstatus` pour voir les détails des logs',
                        inline: false
                    },
                    {
                        name: '🔧 Actions Rapides',
                        value: `\`${prefix}config\` • \`${prefix}setup\` • \`${prefix}security-check\` • \`${prefix}help\``,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Dashboard de ${guild.name} • Serveur créé le ${guild.createdAt.toLocaleDateString('fr-FR')}`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`DASHBOARD viewed by ${message.author.tag} in ${guildId}`);
        } catch (err) {
            client.logger.error('Dashboard command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du dashboard.')] });
        }
    }
};

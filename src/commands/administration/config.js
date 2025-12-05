const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'config',
    description: 'Afficher la configuration complète du serveur',
    category: 'administration',
    aliases: ['configuration', 'settings'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const guildId = message.guild.id;
            const guildConfig = ConfigService.getGuildConfig(guildId) || {};
            const automodConfig = AutomodService.getConfig(guildId);
            
            const prefix = ConfigService.getPrefix(guildId);
            const color = ConfigService.getEmbedColor(guildId);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`⚙️ Configuration de ${message.guild.name}`)
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setDescription(`Voici la configuration actuelle de votre serveur.`)
                .addFields(
                    {
                        name: '📋 Général',
                        value: [
                            `**Préfixe:** \`${prefix}\``,
                            `**Couleur embeds:** \`${color}\``,
                            `**Auto-rôle:** ${guildConfig.autorole_id ? `<@&${guildConfig.autorole_id}>` : '❌ Non configuré'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '👋 Messages',
                        value: [
                            `**Bienvenue:** ${guildConfig.welcome_channel ? `<#${guildConfig.welcome_channel}>` : '❌ Non configuré'}`,
                            `**Au revoir:** ${guildConfig.goodbye_channel ? `<#${guildConfig.goodbye_channel}>` : '❌ Non configuré'}`,
                            `**Vérification:** ${guildConfig.verify_channel ? `<#${guildConfig.verify_channel}>` : '❌ Non configuré'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📝 Logs',
                        value: [
                            `**Logs généraux:** ${guildConfig.log_channel ? `<#${guildConfig.log_channel}>` : '❌ Non configuré'}`,
                            `**Logs modération:** ${guildConfig.modlog_channel ? `<#${guildConfig.modlog_channel}>` : '❌ Non configuré'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🛡️ Sécurité & Auto-modération',
                        value: [
                            `**Anti-Spam:** ${automodConfig.antispam ? '✅' : '❌'}`,
                            `**Anti-Link:** ${automodConfig.antilink ? '✅' : '❌'}`,
                            `**Anti-Flood:** ${automodConfig.antiflood ? '✅' : '❌'}`,
                            `**Anti-Mention:** ${automodConfig.antimention ? '✅' : '❌'}`,
                            `**Anti-JoinRaid:** ${automodConfig.antijoinraid ? '✅' : '❌'}`,
                            `**Anti-Nuke:** ${automodConfig.antinuke ? '✅' : '❌'}`,
                            `**Anti-Edit:** ${automodConfig.antiedit ? '✅' : '❌'}`,
                            `**Anti-Bot:** ${automodConfig.antibot ? '✅' : '❌'}`
                        ].join(' • '),
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Configuration de ${message.guild.name} • Utilisez ${prefix}setup pour un guide de configuration`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`CONFIG viewed by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Config command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage de la configuration.')] });
        }
    }
};

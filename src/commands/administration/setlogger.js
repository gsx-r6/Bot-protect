const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const LOG_TYPES = {
    mod_log: { label: 'Modération', emoji: '🛡️', description: 'Bans, kicks, mutes, warns, etc.' },
    message_log: { label: 'Messages', emoji: '💬', description: 'Suppression et modification de messages' },
    join_log: { label: 'Arrivées', emoji: '➕', description: 'Membres rejoignant le serveur' },
    leave_log: { label: 'Départs', emoji: '➖', description: 'Membres quittant le serveur' },
    voice_log: { label: 'Vocaux', emoji: '🎤', description: 'Logs d\'activité vocale' },
    channel_log: { label: 'Salons', emoji: '#️⃣', description: 'Création et suppression de salons' },
    emoji_log: { label: 'Emojis', emoji: '😀', description: 'Mises à jour des emojis' },
    automod_log: { label: 'AutoMod', emoji: '🤖', description: 'Détections automatiques (spam, mots, etc.)' }
};

module.exports = {
    name: 'setlogger',
    description: 'Configurer les canaux de logs via un menu',
    category: 'administration',
    aliases: ['logger', 'logconfig'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante: Gérer le serveur')] });
            }

            const currentConfig = client.logs.getConfig(message.guild.id) || {};

            const generateEmbed = (config) => {
                const embed = new EmbedBuilder()
                    .setColor(client.config?.embedColor || '#FF69B4')
                    .setAuthor({
                        name: `${client.user.username} | Configuration des Logs`,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setDescription('Sélectionnez un type de log dans le menu ci-dessous pour configurer son salon.')
                    .setTimestamp();

                Object.entries(LOG_TYPES).forEach(([key, data]) => {
                    const channelId = config[key];
                    const value = channelId ? `<#${channelId}>` : '`Non configuré`';
                    embed.addFields({
                        name: `${data.emoji} ${data.label}`,
                        value: value,
                        inline: true
                    });
                });
                return embed;
            };

            const select = new StringSelectMenuBuilder()
                .setCustomId('setlogger_select')
                .setPlaceholder('Choisir une catégorie à configurer...')
                .addOptions(
                    Object.entries(LOG_TYPES).map(([key, data]) => ({
                        label: data.label,
                        value: key,
                        description: data.description,
                        emoji: data.emoji
                    }))
                );

            const row = new ActionRowBuilder().addComponents(select);

            const panelMsg = await message.reply({
                embeds: [generateEmbed(currentConfig)],
                components: [row]
            });

            const collector = panelMsg.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                const selectedType = interaction.values[0];
                const typeData = LOG_TYPES[selectedType];

                await interaction.reply({
                    embeds: [embeds.info(`Veuillez mentionner le salon pour **${typeData.label}** (ou tapez \`clear\` pour désactiver).`)],
                    ephemeral: true
                });

                const msgCollector = message.channel.createMessageCollector({
                    filter: m => m.author.id === message.author.id,
                    time: 30000,
                    max: 1
                });

                msgCollector.on('collect', async (m) => {
                    const content = m.content.toLowerCase();

                    if (content === 'clear' || content === 'none') {
                        client.logs.removeChannel(message.guild.id, selectedType);
                        await m.reply({ embeds: [embeds.success(`Logs de **${typeData.label}** désactivés.`)] });
                    } else {
                        const channel = m.mentions.channels.first() || message.guild.channels.cache.get(m.content);
                        if (!channel || channel.type !== ChannelType.GuildText) {
                            return m.reply({ embeds: [embeds.error('Salon invalide. Veuillez mentionner un salon textuel.')] });
                        }

                        client.logs.setChannel(message.guild.id, selectedType, channel.id);
                        await m.reply({ embeds: [embeds.success(`Logs de **${typeData.label}** configurés dans ${channel}.`)] });
                    }

                    const updatedConfig = client.logs.getConfig(message.guild.id) || {};
                    await panelMsg.edit({ embeds: [generateEmbed(updatedConfig)] });
                });
            });

            collector.on('end', () => {
                panelMsg.edit({ components: [] }).catch(() => { });
            });

        } catch (error) {
            client.logger.error('Error in setlogger command: ' + error.message);
            return message.reply({ embeds: [embeds.error('Une erreur est survenue lors de la configuration.')] });
        }
    }
};

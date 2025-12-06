const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const LOG_TYPES = {
    channel_log: { label: 'Salons', emoji: '#️⃣', description: 'Création / Suppression / Modification de salons' },
    emoji_log: { label: 'Emojis', emoji: '😀', description: 'Création / Suppression / Modification d\'emojis' },
    ban_log: { label: 'Bans', emoji: '🔨', description: 'Ban / Unban de membres' },
    join_log: { label: 'Arrivées', emoji: '➕', description: 'Arrivée de nouveaux membres' },
    leave_log: { label: 'Départs', emoji: '➖', description: 'Départ de membres' },
    message_log: { label: 'Messages', emoji: '💬', description: 'Suppression / Modification de messages' },
    voice_log: { label: 'Vocal', emoji: '🎤', description: 'Activité vocale (join/leave/mute/etc)' },
    mod_log: { label: 'Modération', emoji: '🛡️', description: 'Actions de modération' },
    automod_log: { label: 'AutoMod', emoji: '🤖', description: 'Alertes automod (insultes, argent, etc)' }
};

module.exports = {
    name: 'setlogger',
    description: 'Configurer les canaux du système de logs avancé',
    category: 'administration',
    aliases: ['logger', 'logconfig'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante: Gérer le serveur')] });
            }

            if (!client.loggerService) {
                return message.reply({ embeds: [embeds.error('Le système de logs avancé n\'est pas disponible.')] });
            }

            const currentConfig = client.loggerService.getChannels(message.guild.id) || {};

            const configEmbed = new EmbedBuilder()
                .setColor(client.config?.embedColor || '#FF69B4')
                .setAuthor({
                    name: `${client.user.username} | Configuration des Logs`,
                    iconURL: client.user.displayAvatarURL({ size: 4096 })
                })
                .setDescription('Sélectionnez un type de log pour configurer son canal de destination.')
                .setTimestamp();

            Object.entries(LOG_TYPES).forEach(([key, data]) => {
                const channelId = currentConfig[key];
                const value = channelId ? `<#${channelId}>` : '`Non configuré`';
                configEmbed.addFields({
                    name: `${data.emoji} ${data.label}`,
                    value: value,
                    inline: true
                });
            });

            const select = new StringSelectMenuBuilder()
                .setCustomId('setlogger_type_select')
                .setPlaceholder('Choisir un type de log...')
                .addOptions(
                    Object.entries(LOG_TYPES).map(([key, data]) => ({
                        label: data.label,
                        value: key,
                        description: data.description.substring(0, 50),
                        emoji: data.emoji
                    }))
                );

            const row = new ActionRowBuilder().addComponents(select);

            const panelMsg = await message.reply({ 
                embeds: [configEmbed], 
                components: [row], 
                allowedMentions: { repliedUser: false } 
            });

            const filter = i => i.user.id === message.author.id;
            const collector = panelMsg.createMessageComponentCollector({ filter, time: 300000 });

            collector.on('collect', async (interaction) => {
                try {
                    const selectedType = interaction.values[0];
                    await interaction.deferUpdate();

                    const typeData = LOG_TYPES[selectedType];
                    const infoMsg = await message.channel.send({
                        embeds: [embeds.info(
                            `**${typeData.emoji} ${typeData.label}**\n${typeData.description}\n\n` +
                            `Envoyez:\n` +
                            `• La mention du salon (\`#logs\`)\n` +
                            `• L'ID du salon\n` +
                            `• \`none\` ou \`clear\` pour supprimer\n` +
                            `• \`cancel\` pour annuler`
                        )],
                        allowedMentions: { repliedUser: false }
                    });

                    const msgFilter = m => m.author.id === message.author.id;
                    const msgCollector = message.channel.createMessageCollector({ filter: msgFilter, time: 60000, max: 1 });

                    msgCollector.on('collect', async (m) => {
                        try {
                            const content = m.content.trim().toLowerCase();

                            if (content === 'cancel') {
                                await message.channel.send({ embeds: [embeds.warn('❌ Annulé')] });
                                return;
                            }

                            if (content === 'none' || content === 'clear') {
                                client.loggerService.removeChannel(message.guild.id, selectedType);
                                await message.channel.send({ 
                                    embeds: [embeds.success(`${typeData.emoji} **${typeData.label}** - Configuration supprimée`)] 
                                });
                                await updatePanel();
                                return;
                            }

                            const mentionMatch = m.content.match(/<#(\d+)>/);
                            const idMatch = m.content.match(/^(\d+)$/);
                            const channelId = mentionMatch ? mentionMatch[1] : (idMatch ? idMatch[1] : null);

                            if (!channelId) {
                                return message.channel.send({ 
                                    embeds: [embeds.error('Salon invalide. Mentionnez un salon ou fournissez l\'ID.')] 
                                });
                            }

                            try {
                                const channel = await message.guild.channels.fetch(channelId);
                                if (!channel || channel.type !== ChannelType.GuildText) {
                                    return message.channel.send({ 
                                        embeds: [embeds.error('Le salon doit être un salon texte.')] 
                                    });
                                }

                                if (!channel.permissionsFor(message.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                                    return message.channel.send({ 
                                        embeds: [embeds.error('Je n\'ai pas les permissions pour écrire dans ce salon.')] 
                                    });
                                }

                                client.loggerService.setChannel(message.guild.id, selectedType, channelId);
                                await message.channel.send({ 
                                    embeds: [embeds.success(`${typeData.emoji} **${typeData.label}** configuré: <#${channelId}>`)] 
                                });

                                await updatePanel();

                            } catch (e) {
                                return message.channel.send({ 
                                    embeds: [embeds.error('Impossible de récupérer le salon. Vérifiez l\'ID.')] 
                                });
                            }
                        } catch (e) {
                            console.error('Error processing channel input:', e);
                        }
                    });

                    msgCollector.on('end', collected => {
                        if (collected.size === 0) {
                            message.channel.send({ embeds: [embeds.warn('⏱️ Temps écoulé')] });
                        }
                    });

                } catch (e) {
                    console.error('Error in interaction:', e);
                }
            });

            async function updatePanel() {
                const updatedConfig = client.loggerService.getChannels(message.guild.id) || {};
                const updatedEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({
                        name: `${client.user.username} | Configuration des Logs`,
                        iconURL: client.user.displayAvatarURL({ size: 4096 })
                    })
                    .setDescription('Sélectionnez un type de log pour configurer son canal de destination.')
                    .setTimestamp();

                Object.entries(LOG_TYPES).forEach(([key, data]) => {
                    const cId = updatedConfig[key];
                    const val = cId ? `<#${cId}>` : '`Non configuré`';
                    updatedEmbed.addFields({
                        name: `${data.emoji} ${data.label}`,
                        value: val,
                        inline: true
                    });
                });

                await panelMsg.edit({ embeds: [updatedEmbed] });
            }

            collector.on('end', () => {
                try {
                    panelMsg.edit({ components: [] }).catch(() => {});
                } catch (e) {}
            });

        } catch (error) {
            client.logger.error('Error in setlogger command:', error);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des logs.')] });
        }
    }
};

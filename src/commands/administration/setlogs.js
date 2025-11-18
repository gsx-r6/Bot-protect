const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

const LOG_TYPES = {
    moderation: { label: '🛡️ Moderation', emoji: '🛡️', description: 'Ban / Kick / Mute / Warn' },
    member: { label: '👥 Member', emoji: '👥', description: 'Join / Leave' },
    message: { label: '💬 Message', emoji: '💬', description: 'Delete / Edit' },
    voice: { label: '🎤 Voice', emoji: '🎤', description: 'Join / Leave canal' },
    guild: { label: '⚙️ Guild', emoji: '⚙️', description: 'Config serveur' },
    security: { label: '🔒 Security', emoji: '🔒', description: 'Alerts sécurité' },
    roles: { label: '🎭 Roles', emoji: '🎭', description: 'Assignation rôles' },
    channels: { label: '#️⃣ Channels', emoji: '#️⃣', description: 'Create / Delete / Edit' }
};

module.exports = {
    name: 'setlogs',
    description: 'Configurer les canaux de logs (panel unique)',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante: Gérer le serveur')] });
            }

            const currentConfig = client.logs.getLogChannels();

            // Créer l'embed de configuration
            const configEmbed = embeds.info('📋 **Configuration des Canaux de Logs**\n\nSélectionnez un type de log pour le modifier:');
            configEmbed.setColor('#0099FF');

            // Ajouter tous les types de logs avec leur canal actuel
            Object.entries(LOG_TYPES).forEach(([key, data]) => {
                const channelId = currentConfig[key];
                const value = channelId ? `<#${channelId}>` : '`Non configuré`';
                configEmbed.addFields({
                    name: `${data.emoji} ${data.label}`,
                    value: value,
                    inline: true
                });
            });

            // Menu de sélection pour choisir quel type modifier
            const select = new StringSelectMenuBuilder()
                .setCustomId('setlogs_type_select')
                .setPlaceholder('Choisir un type de log...')
                .addOptions(
                    Object.entries(LOG_TYPES).map(([key, data]) => ({
                        label: data.label.replace(/[🛡️👥💬🎤⚙️🔒🎭#️⃣]/g, '').trim(),
                        value: key,
                        description: data.description,
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
            const collector = panelMsg.createMessageComponentCollector({ filter, time: 300000 }); // 5 min

            collector.on('collect', async (interaction) => {
                try {
                    const selectedType = interaction.values[0];
                    await interaction.deferUpdate();

                    // Afficher un prompt pour configurer ce type
                    const typeData = LOG_TYPES[selectedType];
                    const infoMsg = await message.channel.send({
                        embeds: [embeds.info(
                            `**${typeData.label}** - ${typeData.description}\n\n` +
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

                            // Annuler
                            if (content === 'cancel') {
                                await message.channel.send({ embeds: [embeds.warn('❌ Annulé')] });
                                return;
                            }

                            // Effacer
                            if (content === 'none' || content === 'clear') {
                                client.logs.setLogChannels({ [selectedType]: '' });
                                await message.channel.send({ 
                                    embeds: [embeds.success(`${typeData.emoji} **${selectedType}** - Configuration supprimée`)] 
                                });
                                return;
                            }

                            // Extraire ID du salon
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

                                // Vérifier que le bot peut écrire dans ce salon
                                if (!channel.permissionsFor(message.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                                    return message.channel.send({ 
                                        embeds: [embeds.error('Je n\'ai pas les permissions pour écrire dans ce salon.')] 
                                    });
                                }

                                client.logs.setLogChannels({ [selectedType]: channelId });
                                await message.channel.send({ 
                                    embeds: [embeds.success(`${typeData.emoji} **${selectedType}** configuré: <#${channelId}>`)] 
                                });

                                // Mettre à jour le panel
                                const updatedConfig = client.logs.getLogChannels();
                                const updatedEmbed = embeds.info('📋 **Configuration des Canaux de Logs**\n\nSélectionnez un type de log pour le modifier:');
                                updatedEmbed.setColor('#00FF00');

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

            collector.on('end', () => {
                try {
                    panelMsg.edit({ components: [] }).catch(() => {});
                } catch (e) {}
            });

        } catch (error) {
            client.logger.error('Error in setlogs command:', error);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des logs.')] });
        }
    }
};

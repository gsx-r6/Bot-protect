const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'setlogs',
    description: 'Configurer les canaux de logs (panel interactif)',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Vous devez avoir la permission Gérer le serveur pour utiliser cette commande.')] });
            }

            const LOG_TYPES = [
                { label: 'Moderation', value: 'moderation', description: 'Ban / Kick / Mute / Warn' },
                { label: 'Member', value: 'member', description: 'Join / Leave' },
                { label: 'Message', value: 'message', description: 'Message delete / edit' },
                { label: 'Voice', value: 'voice', description: 'Voice join / leave' },
                { label: 'Guild', value: 'guild', description: 'Config serveur' },
                { label: 'Security', value: 'security', description: 'Alerts sécurité' },
                { label: 'Roles', value: 'roles', description: 'Assignation / retrait rôles' },
                { label: 'Channels', value: 'channels', description: 'Create / Delete / Edit channels' }
            ];

            const select = new StringSelectMenuBuilder()
                .setCustomId('setlogs_select')
                .setPlaceholder('Choisissez le type de log à configurer')
                .addOptions(LOG_TYPES.map(t => ({ label: t.label, value: t.value, description: t.description })));

            const row = new ActionRowBuilder().addComponents(select);

            const help = embeds.info('Sélectionnez le type de log que vous souhaitez configurer. Après sélection, envoyez en réponse la mention du salon ou l\'ID du salon. Tapez `none` pour effacer.');

            const sent = await message.reply({ embeds: [help], components: [row], allowedMentions: { repliedUser: false } });

            const filter = i => i.user.id === message.author.id;

            const collector = sent.createMessageComponentCollector({ filter, time: 120000, max: 1 });

            collector.on('collect', async (interaction) => {
                try {
                    await interaction.deferUpdate();
                    const selected = interaction.values[0];

                    const prompt = await message.channel.send({ embeds: [embeds.info(`Vous avez choisi **${selected}**. Merci de mentionner le salon (ex: #logs) ou envoyer l'ID du salon. Tapez \\`none\\` pour supprimer cette configuration.`)], allowedMentions: { repliedUser: false } });

                    const msgFilter = m => m.author.id === message.author.id;
                    const msgCollector = message.channel.createMessageCollector({ filter: msgFilter, time: 120000, max: 1 });

                    msgCollector.on('collect', async (m) => {
                        const content = m.content.trim();
                        if (content.toLowerCase() === 'none') {
                            client.logs.setLogChannels({ [selected]: '' });
                            await message.channel.send({ embeds: [embeds.success(`Configuration supprimée pour **${selected}**.`)], allowedMentions: { repliedUser: false } });
                            return;
                        }

                        // Extract channel id from mention or id
                        const mentionMatch = content.match(/<#(\d+)>/);
                        const idMatch = content.match(/^(\d+)$/);
                        const channelId = mentionMatch ? mentionMatch[1] : (idMatch ? idMatch[1] : null);

                        if (!channelId) {
                            return message.channel.send({ embeds: [embeds.error('Salon invalide. Veuillez mentionner un salon ou fournir son ID.')], allowedMentions: { repliedUser: false } });
                        }

                        try {
                            const channel = await message.guild.channels.fetch(channelId);
                            if (!channel || channel.type !== ChannelType.GuildText) {
                                return message.channel.send({ embeds: [embeds.error('Le salon doit être un salon texte.')], allowedMentions: { repliedUser: false } });
                            }

                            client.logs.setLogChannels({ [selected]: channelId });
                            await message.channel.send({ embeds: [embeds.success(`Canal configuré pour **${selected}**: <#${channelId}>`)], allowedMentions: { repliedUser: false } });
                        } catch (e) {
                            return message.channel.send({ embeds: [embeds.error('Impossible de récupérer le salon. Vérifiez l\'ID.')], allowedMentions: { repliedUser: false } });
                        }
                    });

                    msgCollector.on('end', collected => {
                        if (collected.size === 0) {
                            message.channel.send({ embeds: [embeds.warn('Temps écoulé. Recommencez la commande.')], allowedMentions: { repliedUser: false } });
                        }
                    });

                } catch (e) {
                    console.error(e);
                }
            });

            collector.on('end', collected => {
                try {
                    sent.edit({ components: [] }).catch(() => {});
                } catch (e) {}
            });

        } catch (error) {
            client.logger.error('Error in setlogs command:', error);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des logs.')] });
        }
    }
};

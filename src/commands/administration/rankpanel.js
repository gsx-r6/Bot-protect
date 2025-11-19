const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const embeds = require('../../utils/embeds');
const RankPermissionService = require('../../services/RankPermissionService');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'rankpanel',
    description: 'Panel interactif pour gérer les rôles avec système hiérarchique',
    category: 'administration',
    aliases: ['panelrank', 'rp'],
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 5,
    usage: '',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Vous avez besoin de la permission "Gérer les rôles" pour utiliser cette commande.')] });
            }

            const color = ConfigService.getEmbedColor(message.guild.id);
            const availableRoles = RankPermissionService.getAvailableRolesToGive(message.guild, message.member);

            if (availableRoles.length === 0) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez donner aucun rôle selon les permissions configurées.')] });
            }

            // Pagination pour naviguer dans les rôles et recherche
            const ROLES_PER_PAGE = 20;
            let currentPage = 0;
            const totalPages = Math.max(1, Math.ceil(availableRoles.length / ROLES_PER_PAGE));

            const getRoleOptionsForPage = (page) => {
                const start = page * ROLES_PER_PAGE;
                const end = start + ROLES_PER_PAGE;
                return availableRoles.slice(start, end).map((role, idx) => ({
                    label: role.name.substring(0, 95),
                    description: `Position: ${role.position} | #${start + idx + 1}`,
                    value: role.id,
                    emoji: '🎭'
                }));
            };

            // Helper pour créer un menu de sélection avec limite Discord (max 25 options)
            const createRoleSelectMenu = (roles, customId = 'rank_role_select', placeholder = null) => {
                const options = roles.slice(0, 25).map((role, idx) => ({
                    label: role.name.substring(0, 95),
                    description: `Position: ${role.position} | #${idx + 1}`,
                    value: role.id,
                    emoji: '🎭'
                }));
                return new StringSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(placeholder || 'Sélectionnez un rôle')
                    .addOptions(options);
            };

            const renderPanelEmbed = (page = currentPage) => {
                const e = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('🎛️ Panel de Gestion des Rôles')
                    .setDescription('Utilisez les menus ci-dessous pour gérer les rôles des membres.')
                    .addFields(
                        { name: '📋 Étape 1', value: 'Sélectionnez un rôle à attribuer', inline: false },
                        { name: '👤 Étape 2', value: 'Mentionnez le membre dans le chat', inline: false },
                        { name: '✅ Étape 3', value: 'Cliquez sur "Ajouter" ou "Retirer"', inline: false },
                        { name: '📊 Rôles disponibles', value: `${availableRoles.length} rôle(s)`, inline: true },
                        { name: '📄 Page', value: `${page + 1}/${totalPages}`, inline: true }
                    )
                    .setFooter({ text: 'Le panel expire après 5 minutes d\'inactivité' })
                    .setTimestamp();
                return e;
            };

            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId('rank_role_select')
                .setPlaceholder(`Sélectionnez un rôle à attribuer (Page ${currentPage + 1}/${totalPages})`)
                .addOptions(getRoleOptionsForPage(currentPage));

            const row1 = new ActionRowBuilder().addComponents(roleSelect);

            const prevButton = new ButtonBuilder()
                .setCustomId('rank_prev_page')
                .setLabel('◀ Précédent')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0);

            const nextButton = new ButtonBuilder()
                .setCustomId('rank_next_page')
                .setLabel('Suivant ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1);

            const pageButton = new ButtonBuilder()
                .setCustomId('rank_page_info')
                .setLabel(`Page ${currentPage + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const paginationRow = new ActionRowBuilder().addComponents(prevButton, pageButton, nextButton);

            const addButton = new ButtonBuilder()
                .setCustomId('rank_add')
                .setLabel('Ajouter le rôle')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const removeButton = new ButtonBuilder()
                .setCustomId('rank_remove')
                .setLabel('Retirer le rôle')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const searchButton = new ButtonBuilder()
                .setCustomId('rank_search')
                .setLabel('🔎 Rechercher un rôle')
                .setStyle(ButtonStyle.Primary);

            const listButton = new ButtonBuilder()
                .setCustomId('rank_list')
                .setLabel('Voir mes permissions')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋');

            const cancelButton = new ButtonBuilder()
                .setCustomId('rank_cancel')
                .setLabel('Annuler')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🚫');

            const row2 = new ActionRowBuilder().addComponents(addButton, removeButton, searchButton, listButton, cancelButton);
            
            const row3 = new ActionRowBuilder().addComponents(paginationRow.components);

            const panelMessage = await message.reply({ embeds: [renderPanelEmbed()], components: [row1, row3, row2] });

            let selectedRole = null;
            let targetMember = null;

            const collector = panelMessage.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 300000
            });

            const buttonCollector = panelMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '❌ Ce panel ne vous est pas destiné!', ephemeral: true });
                }

                if (interaction.customId === 'rank_role_select') {
                    selectedRole = message.guild.roles.cache.get(interaction.values[0]);
                    
                    const updateEmbed = renderPanelEmbed(currentPage)
                        .setColor('#00AA00')
                        .setTitle('✅ Rôle sélectionné')
                        .setFields(
                            { name: '🎭 Rôle', value: `${selectedRole}`, inline: false },
                            { name: '👤 Étape suivante', value: 'Mentionnez un membre dans le chat puis cliquez sur "Ajouter" ou "Retirer"', inline: false },
                            { name: '⏱️ Rappel', value: `Le panel expire dans 5 minutes`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.update({ embeds: [updateEmbed] });
                }
            });

            buttonCollector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '❌ Ce panel ne vous est pas destiné!', ephemeral: true });
                }

                // Pagination (prev/next) — on met à jour aussi l'embed
                if (interaction.customId === 'rank_next_page' || interaction.customId === 'rank_prev_page') {
                    if (interaction.customId === 'rank_next_page' && currentPage < totalPages - 1) currentPage++;
                    if (interaction.customId === 'rank_prev_page' && currentPage > 0) currentPage--;

                    const newRoleOptions = getRoleOptionsForPage(currentPage);
                    const newRoleSelect = new StringSelectMenuBuilder()
                        .setCustomId('rank_role_select')
                        .setPlaceholder(`Sélectionnez un rôle à attribuer (Page ${currentPage + 1}/${totalPages})`)
                        .addOptions(newRoleOptions);

                    const newPrevButton = new ButtonBuilder()
                        .setCustomId('rank_prev_page')
                        .setLabel('◀ Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0);

                    const newNextButton = new ButtonBuilder()
                        .setCustomId('rank_next_page')
                        .setLabel('Suivant ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages - 1);

                    const newPageButton = new ButtonBuilder()
                        .setCustomId('rank_page_info')
                        .setLabel(`Page ${currentPage + 1}/${totalPages}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    const newPaginationRow = new ActionRowBuilder().addComponents(newPrevButton, newPageButton, newNextButton);
                    const newRow1 = new ActionRowBuilder().addComponents(newRoleSelect);

                    const updatedEmbed = renderPanelEmbed(currentPage);

                    await interaction.update({ embeds: [updatedEmbed], components: [newRow1, newPaginationRow, row2] });
                    return;
                }

                // Afficher page info
                if (interaction.customId === 'rank_page_info') {
                    return interaction.reply({ content: `Vous êtes à la page ${currentPage + 1} sur ${totalPages}`, ephemeral: true });
                }

                // Annuler
                if (interaction.customId === 'rank_cancel') {
                    collector.stop();
                    buttonCollector.stop();
                    await interaction.update({ 
                        embeds: [embeds.success('Panel fermé.', '🚫 Annulé')], 
                        components: [] 
                    });
                    return;
                }

                // Voir la liste (ephemeral)
                if (interaction.customId === 'rank_list') {
                    const listEmbed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle('📋 Vos permissions de rank')
                        .setDescription(`Vous pouvez attribuer **${availableRoles.length}** rôle(s)`)
                        .addFields({
                            name: 'Rôles disponibles',
                            value: availableRoles.slice(0, 20).map(r => `• ${r}`).join('\n') || 'Aucun',
                            inline: false
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [listEmbed], ephemeral: true });
                    return;
                }

                // Recherche de rôle (permet de taper un nom / id et d'afficher les correspondances)
                if (interaction.customId === 'rank_search') {
                    await interaction.deferUpdate();
                    const prompt = await message.channel.send({ embeds: [embeds.info('🔎 Envoyez le nom (ou une partie) du rôle à rechercher, ou l\'ID du rôle. Tapez `cancel` ou `retour` pour revenir.')], allowedMentions: { repliedUser: false } });

                    const msgFilter = m => m.author.id === message.author.id;
                    const queryCollector = message.channel.createMessageCollector({ filter: msgFilter, time: 60000, max: 1 });

                    queryCollector.on('collect', async (m) => {
                        const q = m.content.trim();
                        if (!q) return message.channel.send({ embeds: [embeds.error('Recherche vide.')], allowedMentions: { repliedUser: false } });

                        // Retour au panel normal
                        if (q.toLowerCase() === 'cancel' || q.toLowerCase() === 'retour') {
                            const pageRoles = availableRoles.slice(currentPage * ROLES_PER_PAGE, (currentPage + 1) * ROLES_PER_PAGE);
                            const normalSelect = createRoleSelectMenu(pageRoles, 'rank_role_select', `Sélectionnez un rôle à attribuer (Page ${currentPage + 1}/${totalPages})`);
                            const normalRow = new ActionRowBuilder().addComponents(normalSelect);
                            await panelMessage.edit({ embeds: [renderPanelEmbed(currentPage)], components: [normalRow, row3, row2] });
                            return message.channel.send({ embeds: [embeds.info('ℹ️ Retour au panel principal.')], allowedMentions: { repliedUser: false } });
                        }

                        // Recherche (nom partiel ou ID)
                        const matches = availableRoles.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.id === q);

                        if (matches.length === 0) {
                            return message.channel.send({ embeds: [embeds.warn('Aucun rôle trouvé pour cette recherche.')], allowedMentions: { repliedUser: false } });
                        }

                        // Limiter à 25 et afficher un avertissement si plus
                        const displayCount = Math.min(matches.length, 25);
                        const searchSelect = createRoleSelectMenu(matches, 'rank_role_select', `Résultats: ${matches.length} rôle(s)`);
                        const searchRow = new ActionRowBuilder().addComponents(searchSelect);

                        const updatedEmbed = renderPanelEmbed(currentPage)
                            .setColor('#0099FF')
                            .setTitle(`🔎 Résultats: ${matches.length} rôle(s)`);
                        if (matches.length > 25) {
                            updatedEmbed.setDescription(`Affichage des 25 premiers résultats. Affinez votre recherche pour plus de précision.`);
                        }

                        await panelMessage.edit({ embeds: [updatedEmbed], components: [searchRow, row3, row2] });
                        await message.channel.send({ embeds: [embeds.success(`✅ ${displayCount} résultat(s) affichés${matches.length > 25 ? ` sur ${matches.length}` : ''}.`)], allowedMentions: { repliedUser: false } });
                    });

                    queryCollector.on('end', collected => {
                        if (collected.size === 0) message.channel.send({ embeds: [embeds.warn('⏱️ Temps écoulé pour la recherche.')], allowedMentions: { repliedUser: false } });
                    });

                    return;
                }

                // Les actions add/remove nécessitent une sélection au préalable
                if (!selectedRole) {
                    return interaction.reply({ content: '❌ Veuillez d\'abord sélectionner un rôle dans le menu déroulant!', ephemeral: true });
                }

                const channel = interaction.channel;
                await interaction.reply({ content: '👤 Mentionnez le membre à qui attribuer/retirer le rôle:', ephemeral: false });

                const filter = m => m.author.id === message.author.id && m.mentions.members.size > 0;
                const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => null);

                if (!collected) {
                    return interaction.followUp({ content: '⏰ Temps écoulé. Veuillez réessayer.', ephemeral: true });
                }

                targetMember = collected.first().mentions.members.first();

                if (selectedRole.managed) {
                    return interaction.followUp({ content: '❌ Je ne peux pas gérer les rôles automatiques (bots, boosts, etc.).', ephemeral: true });
                }

                if (selectedRole.position >= message.guild.members.me.roles.highest.position) {
                    return interaction.followUp({ content: '❌ Je ne peux pas gérer ce rôle (ma position est trop basse).', ephemeral: true });
                }

                const isRemoval = interaction.customId === 'rank_remove';
                const permissionCheck = RankPermissionService.canGiveRole(message.guild, message.member, selectedRole.id, targetMember, isRemoval);
                
                if (!permissionCheck.canGive) {
                    return interaction.followUp({ content: `❌ Vous ne pouvez pas ${isRemoval ? 'retirer' : 'donner'} ce rôle.\nRaison: ${permissionCheck.reason}`, ephemeral: true });
                }

                if (interaction.customId === 'rank_add') {
                    if (targetMember.roles.cache.has(selectedRole.id)) {
                        return interaction.followUp({ content: `❌ ${targetMember.user.tag} possède déjà le rôle ${selectedRole.name}.`, ephemeral: true });
                    }

                    await targetMember.roles.add(selectedRole);

                    const successEmbed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle('✅ Rôle ajouté avec succès')
                        .addFields(
                            { name: 'Membre', value: `${targetMember}`, inline: true },
                            { name: 'Rôle', value: `${selectedRole}`, inline: true },
                            { name: 'Par', value: `${message.author}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.followUp({ embeds: [successEmbed] });
                    client.logger.command(`RANKPANEL ADD: ${selectedRole.name} to ${targetMember.user.tag} by ${message.author.tag} in ${message.guild.id}`);

                } else if (interaction.customId === 'rank_remove') {
                    if (!targetMember.roles.cache.has(selectedRole.id)) {
                        return interaction.followUp({ content: `❌ ${targetMember.user.tag} ne possède pas le rôle ${selectedRole.name}.`, ephemeral: true });
                    }

                    await targetMember.roles.remove(selectedRole);

                    const successEmbed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle('✅ Rôle retiré avec succès')
                        .addFields(
                            { name: 'Membre', value: `${targetMember}`, inline: true },
                            { name: 'Rôle', value: `${selectedRole}`, inline: true },
                            { name: 'Par', value: `${message.author}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.followUp({ embeds: [successEmbed] });
                    client.logger.command(`RANKPANEL REMOVE: ${selectedRole.name} from ${targetMember.user.tag} by ${message.author.tag} in ${message.guild.id}`);
                }

                selectedRole = null;
                targetMember = null;
            });

            collector.on('end', () => {
                const timeoutEmbed = embeds.error('Le panel a expiré après 5 minutes d\'inactivité.');
                panelMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            });

        } catch (err) {
            client.logger.error('Rankpanel command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du panel.')] });
        }
    }
};

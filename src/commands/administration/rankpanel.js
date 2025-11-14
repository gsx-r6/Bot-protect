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

            const roleOptions = availableRoles.slice(0, 25).map(role => ({
                label: role.name,
                description: `Position: ${role.position}`,
                value: role.id,
                emoji: '🎭'
            }));

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎛️ Panel de Gestion des Rôles')
                .setDescription('Utilisez les menus ci-dessous pour gérer les rôles des membres.')
                .addFields(
                    { name: '📋 Étape 1', value: 'Sélectionnez un rôle à attribuer', inline: false },
                    { name: '👤 Étape 2', value: 'Mentionnez le membre dans le chat', inline: false },
                    { name: '✅ Étape 3', value: 'Cliquez sur "Ajouter" ou "Retirer"', inline: false },
                    { name: '📊 Rôles disponibles', value: `${availableRoles.length} rôle(s)`, inline: true }
                )
                .setFooter({ text: 'Le panel expire après 5 minutes d\'inactivité' })
                .setTimestamp();

            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId('rank_role_select')
                .setPlaceholder('Sélectionnez un rôle à attribuer')
                .addOptions(roleOptions);

            const row1 = new ActionRowBuilder().addComponents(roleSelect);

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

            const row2 = new ActionRowBuilder().addComponents(addButton, removeButton, listButton, cancelButton);

            const panelMessage = await message.reply({ embeds: [embed], components: [row1, row2] });

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
                    
                    const updateEmbed = EmbedBuilder.from(embed)
                        .setFields(
                            { name: '✅ Rôle sélectionné', value: `${selectedRole}`, inline: false },
                            { name: '👤 Étape suivante', value: 'Mentionnez un membre dans le chat puis cliquez sur "Ajouter" ou "Retirer"', inline: false },
                            { name: '📊 Rôles disponibles', value: `${availableRoles.length} rôle(s)`, inline: true }
                        );

                    await interaction.update({ embeds: [updateEmbed] });
                }
            });

            buttonCollector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '❌ Ce panel ne vous est pas destiné!', ephemeral: true });
                }

                if (interaction.customId === 'rank_cancel') {
                    collector.stop();
                    buttonCollector.stop();
                    await interaction.update({ 
                        embeds: [embeds.success('Panel fermé.', '🚫 Annulé')], 
                        components: [] 
                    });
                    return;
                }

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

                const permissionCheck = RankPermissionService.canGiveRole(message.guild, message.member, selectedRole.id);
                
                if (!permissionCheck.canGive) {
                    return interaction.followUp({ content: `❌ Vous ne pouvez pas donner ce rôle.\nRaison: ${permissionCheck.reason}`, ephemeral: true });
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

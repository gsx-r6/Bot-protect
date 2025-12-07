const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction, client) {
        // --- BOUTONS JTC ---
        if (interaction.isButton() && interaction.customId.startsWith('jtc_')) {
            const channel = interaction.channel;

            // Vérifier si c'est un salon temp
            const tempInfo = db.db.prepare(`SELECT * FROM temp_channels WHERE channel_id = ?`).get(channel.id);
            if (!tempInfo) return interaction.reply({ content: '❌ Ce n\'est pas un salon temporaire.', ephemeral: true });

            // Vérifier permissions (Owner ou Admin)
            if (interaction.user.id !== tempInfo.owner_id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Seul le propriétaire du salon peut faire ça.', ephemeral: true });
            }

            switch (interaction.customId) {
                case 'jtc_lock':
                    await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
                    interaction.reply({ content: '🔒 Salon verrouillé pour @everyone.', ephemeral: true });
                    break;
                case 'jtc_unlock':
                    await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
                    interaction.reply({ content: '🔓 Salon déverrouillé.', ephemeral: true });
                    break;
                case 'jtc_hide':
                    await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
                    interaction.reply({ content: '👁️ Salon masqué.', ephemeral: true });
                    break;
                case 'jtc_show':
                    await channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null });
                    interaction.reply({ content: '👀 Salon visible.', ephemeral: true });
                    break;
                case 'jtc_rename':
                    // Modal
                    const renameModal = new ModalBuilder()
                        .setCustomId('jtc_modal_rename')
                        .setTitle('Renommer le salon');
                    const nameInput = new TextInputBuilder()
                        .setCustomId('jtc_name_input')
                        .setLabel('Nouveau nom')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(true);
                    renameModal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                    await interaction.showModal(renameModal);
                    break;
                case 'jtc_limit':
                    // Modal
                    const limitModal = new ModalBuilder()
                        .setCustomId('jtc_modal_limit')
                        .setTitle('Définir la limite (0-99)');
                    const limitInput = new TextInputBuilder()
                        .setCustomId('jtc_limit_input')
                        .setLabel('Nombre de places')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(2)
                        .setRequired(true);
                    limitModal.addComponents(new ActionRowBuilder().addComponents(limitInput));
                    await interaction.showModal(limitModal);
                    break;
            }
        }

        // --- MODALS JTC ---
        if (interaction.isModalSubmit() && interaction.customId.startsWith('jtc_modal_')) {
            const channel = interaction.channel;

            if (interaction.customId === 'jtc_modal_rename') {
                const newName = interaction.fields.getTextInputValue('jtc_name_input');
                await channel.setName(newName);
                interaction.reply({ content: `✅ Salon renommé en **${newName}**`, ephemeral: true });
            }

            if (interaction.customId === 'jtc_modal_limit') {
                const limit = parseInt(interaction.fields.getTextInputValue('jtc_limit_input'));
                if (isNaN(limit) || limit < 0 || limit > 99) return interaction.reply({ content: '❌ Nombre invalide.', ephemeral: true });
                await channel.setUserLimit(limit);
                interaction.reply({ content: `✅ Limite définie à **${limit === 0 ? 'Illimité' : limit}**`, ephemeral: true });
            }
        }
    }
};

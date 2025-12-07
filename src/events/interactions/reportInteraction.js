const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!['report_claim', 'report_resolve', 'report_dismiss'].includes(interaction.customId)) return;

        // Récupérer l'Embed
        const message = interaction.message;
        const embed = message.embeds[0];
        if (!embed) return;

        const newEmbed = EmbedBuilder.from(embed);

        if (interaction.customId === 'report_claim') {
            newEmbed.setColor('#FFA500'); // Orange
            newEmbed.addFields({ name: '👀 Pris en charge par', value: interaction.user.tag, inline: false });

            // Mettre à jour le bouton pour qu'il soit désactivé ?
            const row = ActionRowBuilder.from(message.components[0]);
            row.components[0].setDisabled(true); // Disable Claim

            await interaction.update({ embeds: [newEmbed], components: [row] });
        }

        if (interaction.customId === 'report_resolve') {
            newEmbed.setColor('#00FF00'); // Vert
            newEmbed.addFields({ name: '✅ Résolu par', value: interaction.user.tag, inline: false });

            // Désactiver tous les boutons
            const row = ActionRowBuilder.from(message.components[0]);
            row.components.forEach(btn => btn.setDisabled(true));

            await interaction.update({ embeds: [newEmbed], components: [row] });

            // Notifier le user ? (Complexe car on n'a pas son ID facilement accessible sans parser l'embed)
            // Pour le MVP UHQ, on en reste là.
        }

        if (interaction.customId === 'report_dismiss') {
            newEmbed.setColor('#808080'); // Gris
            newEmbed.setTitle('🗑️ Signalement Rejeté');
            newEmbed.addFields({ name: '🚫 Rejeté par', value: interaction.user.tag, inline: false });

            // Désactiver tous les boutons
            const row = ActionRowBuilder.from(message.components[0]);
            row.components.forEach(btn => btn.setDisabled(true));

            await interaction.update({ embeds: [newEmbed], components: [row] });
        }
    }
};

const { Events } = require('discord.js');
const ConfigService = require('../../services/ConfigService');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'verify_user') return;

        try {
            const config = ConfigService.getGuildConfig(interaction.guild.id);
            if (!config || !config.verify_role_id) {
                return interaction.reply({ content: "Le système de vérification n'est pas correctement configuré.", ephemeral: true });
            }

            const role = interaction.guild.roles.cache.get(config.verify_role_id);
            if (!role) {
                return interaction.reply({ content: "Le rôle de vérification est introuvable.", ephemeral: true });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({ content: "Vous êtes déjà vérifié !", ephemeral: true });
            }

            // Security Check: Is the user quarantined?
            if (config.quarantine_role_id && interaction.member.roles.cache.has(config.quarantine_role_id)) {
                return interaction.reply({ content: "❌ Vous êtes actuellement en quarantaine de sécurité. Veuillez attendre la fin du raid ou une vérification manuelle par le staff.", ephemeral: true });
            }

            await interaction.member.roles.add(role);

            // Log via LogService
            if (client.logs) {
                await client.logs.logSecurity(interaction.guild, 'VÉRIFICATION', {
                    user: interaction.user,
                    description: 'Utilisateur vérifié via le bouton',
                    severity: 'INFO'
                });
            }

            return interaction.reply({ content: "Vous avez été vérifié avec succès ! Accès accordé.", ephemeral: true });
        } catch (error) {
            logger.error('[Verification Interaction] Erreur:', error);
            return interaction.reply({ content: "Une erreur est survenue lors de la vérification.", ephemeral: true });
        }
    }
};

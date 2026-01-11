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

            await interaction.member.roles.add(role);
            
            // Log if security channel exists
            if (config.log_channel) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel);
                if (logChannel) {
                    logChannel.send({ content: `✅ **${interaction.user.tag}** s'est vérifié.` }).catch(() => {});
                }
            }

            return interaction.reply({ content: "Vous avez été vérifié avec succès ! Accès accordé.", ephemeral: true });
        } catch (error) {
            logger.error('[Verification Interaction] Erreur:', error);
            return interaction.reply({ content: "Une erreur est survenue lors de la vérification.", ephemeral: true });
        }
    }
};

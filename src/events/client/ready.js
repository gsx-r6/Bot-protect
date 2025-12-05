const { Events, ActivityType } = require('discord.js');
const logger = require('../../utils/logger');
const LogService = require('../../services/LogService');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        logger.success(`✅ Bot connecté : ${client.user.tag}`);
        logger.info(`📊 Serveurs : ${client.guilds.cache.size}`);
        logger.info(`👥 Utilisateurs : ${client.users.cache.size}`);
        logger.info(`🎯 Préfixe : ${client.config.PREFIX || '+'}`);

        // Initialiser le service de logging
        client.logs = new LogService(client);
        logger.success('📝 Service de logging initialisé (lazy loading)');

        // Afficher les canaux de log configurés
        const logChannels = client.logs.getLogChannels();
        const configuredChannels = Object.entries(logChannels)
            .filter(([_, id]) => id)
            .map(([type, id]) => `${type}: ${id}`)
            .join(', ');

        if (configuredChannels) {
            logger.info(`📝 Canaux de log configurés: ${configuredChannels}`);
        } else {
            logger.warn('⚠️ Aucun canal de log configuré. Configure les variables d\'environnement.');
        }

        client.user.setPresence({
            activities: [{
                name: '{+} uhq Monde | {+}help',
                type: ActivityType.Watching
            }],
            status: 'online'
        });

        logger.success('🛡️ {+} uhq Monde est prêt !');
    }
};

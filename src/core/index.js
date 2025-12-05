const { loadEnvironment } = require('./envLoader');
const NamiClient = require('./client');
const SecurityAudit = require('../security/securityAudit');
const logger = require('../utils/logger');
const path = require('path');

// Forcer la timezone française si non définie
process.env.TZ = process.env.TZ || 'Europe/Paris';

console.log(`\n{+} UHQ MONDE - STARTING\n`);

(async () => {
    try {
        loadEnvironment();

        // Test du système de logs
        logger.info('🔍 Test du système de logs...');
        logger.success('✅ Log SUCCESS fonctionne !');
        logger.warn('⚠️ Log WARN fonctionne !');
        logger.error('❌ Log ERROR fonctionne !');
        logger.debug('🔍 Log DEBUG fonctionne (uniquement si LOG_LEVEL=debug)');
        logger.command('/test commande');

        logger.info(`📁 Logs enregistrés dans : ${path.join(process.cwd(), 'data', 'logs')}`);
        logger.info(`📊 Taille des logs : ${logger.getLogsSize()} MB`);

        if (process.env.SECURITY_AUDIT_ON_START === 'true') {
            logger.info('Lancement de l\'audit de sécurité...');
            const audit = new SecurityAudit();
            const result = await audit.runFullAudit();
            if (!result.safe && process.env.SECURITY_BLOCK_ON_VULNERABILITIES === 'true') {
                logger.error('Démarrage bloqué en raison de vulnérabilités');
                process.exit(1);
            }
        }

        const client = new NamiClient();
        await client.start();

    } catch (error) {
        logger.error('Erreur fatale au démarrage:', error);
        process.exit(1);
    }
})();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    // On ne quitte pas forcément le processus pour garder le bot en vie, 
    // sauf si c'est critique. Ici on log juste.
    // process.exit(1); 
});

process.on('SIGINT', () => {
    logger.info('🛑 Arrêt du bot (SIGINT)...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Arrêt du bot (SIGTERM)...');
    process.exit(0);
});


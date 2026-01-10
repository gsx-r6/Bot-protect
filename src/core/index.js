const { loadEnvironment } = require('./envLoader');
const NamiClient = require('./client');
const SecurityAudit = require('../security/securityAudit');
const logger = require('../utils/logger');
const path = require('path');

// Force French timezone if not defined
process.env.TZ = process.env.TZ || 'Europe/Paris';

logger.info('🚀 {+} UHQ MONDE - STARTING');

(async () => {
    try {
        loadEnvironment();

        // Note: envLoader handles critical variable validation (TOKEN, OWNER_ID)

        // Test logging system
        logger.debug('Validation du logger...');
        if (process.env.NODE_ENV === 'development') {
            logger.debug('🔍 Debug mode activé');
        }

        logger.info(`📁 Logs path: ${path.join(process.cwd(), 'data', 'logs')}`);

        // Security Audit
        if (process.env.SECURITY_AUDIT_ON_START === 'true') {
            logger.info('🛡️ Lancement de l\'audit de sécurité...');
            const audit = new SecurityAudit();
            const result = await audit.runFullAudit();
            if (!result.safe && process.env.SECURITY_BLOCK_ON_VULNERABILITIES === 'true') {
                logger.error('🛑 Démarrage bloqué par sécurité (Vulnérabilités détectées)');
                process.exit(1);
            }
        }

        // Initialize Client
        const client = new NamiClient();
        await client.start();

    } catch (error) {
        logger.error('❌ Erreur fatale au démarrage:', error);
        setTimeout(() => process.exit(1), 1000); // Allow logs to flush
    }
})();

// Graceful Shutdown Handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection:', reason);
    // Do not exit on unhandled rejection to keep bot alive, but log strictly
});

process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    logger.error('Stack:', err.stack);

    // Recovery attempt or graceful shutdown
    logger.warn('⚠️ Critical error caught. Attempting safe shutdown...');
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

async function gracefulShutdown(signal) {
    logger.info(`🛑 Arrêt du bot (${signal})...`);
    // Add any cleanup logic here (DB closing, etc. if needed)

    // Give time for logs to write to disk
    logger.info('👋 Au revoir !');
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));


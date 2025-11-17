const { loadEnvironment } = require('./envLoader');
const HarukaClient = require('./client');
const SecurityAudit = require('../security/securityAudit');
const logger = require('../utils/logger');
const path = require('path');

console.log(`\n{+} NAMI - STARTING\n`);

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
            logger.info('Running security audit...');
            const audit = new SecurityAudit();
            const result = await audit.runFullAudit();
            if (!result.safe && process.env.SECURITY_BLOCK_ON_VULNERABILITIES === 'true') {
                logger.error('Startup blocked due to vulnerabilities');
                process.exit(1);
            }
        }

        const client = new HarukaClient();
        await client.start();

    } catch (error) {
        logger.error('Fatal error on startup:', error);
        process.exit(1);
    }
})();

process.on('unhandledRejection', (err) => logger.error('Unhandled Rejection:', err));
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); process.exit(1); });


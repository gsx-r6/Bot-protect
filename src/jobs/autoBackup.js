const BackupService = require('../services/BackupService');
const logger = require('../utils/logger');

/**
 * Job de backup automatique quotidien
 */
class AutoBackupJob {
    constructor(client) {
        this.client = client;
        this.interval = null;
    }

    start() {
        // Backup quotidien à 3h du matin
        const scheduleBackup = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(3, 0, 0, 0);

            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            const timeUntilBackup = target - now;

            setTimeout(async () => {
                await this.performBackups();
                scheduleBackup(); // Reprogrammer pour le lendemain
            }, timeUntilBackup);
        };

        scheduleBackup();
        logger.info('[AutoBackup] Job de backup automatique démarré');
    }

    async performBackups() {
        try {
            logger.info('[AutoBackup] Démarrage des backups automatiques...');

            for (const guild of this.client.guilds.cache.values()) {
                try {
                    const result = await BackupService.createBackup(guild);
                    if (result.success) {
                        logger.info(`[AutoBackup] Backup créé pour ${guild.name}`);
                    } else {
                        logger.error(`[AutoBackup] Échec pour ${guild.name}: ${result.error}`);
                    }
                } catch (err) {
                    logger.error(`[AutoBackup] Erreur pour ${guild.name}:`, err);
                }

                // Attendre 5 secondes entre chaque backup
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            logger.info('[AutoBackup] Backups automatiques terminés');
        } catch (err) {
            logger.error('[AutoBackup] Erreur globale:', err);
        }
    }
}

module.exports = AutoBackupJob;

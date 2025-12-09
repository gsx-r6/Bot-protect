const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * SYSTÈME DE LOGS PROFESSIONNEL - {+} NAMI PROTECT
 * 
 * ✅ Logs dans la console (avec couleurs) ET dans des fichiers
 * 📁 Dossier : data/logs/
 * 
 * Niveaux: info, success, warn, error, debug
 */

class Logger {
    constructor() {
        // Chemins des fichiers de logs (dans data/logs/)
        this.logsDir = path.join(process.cwd(), 'data', 'logs');
        this.combinedLogPath = path.join(this.logsDir, 'combined.log');
        this.errorLogPath = path.join(this.logsDir, 'error.log');
        this.debugLogPath = path.join(this.logsDir, 'debug.log');

        // Créer le dossier data/logs/ s'il n'existe pas
        this.ensureLogDirectory();

        // Niveau de log (depuis .env ou défaut)
        this.logLevel = process.env.LOG_LEVEL || 'info';
    }

    /**
     * Créer le dossier data/logs/ récursivement
     */
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
        } catch (error) {
            console.error(chalk.red('❌ Erreur création dossier logs:'), error.message);
        }
    }

    /**
     * Format timestamp français
     */
    getTimestamp() {
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const time = now.toLocaleTimeString('fr-FR');
        return `[${date} ${time}]`;
    }

    /**
     * Écrire dans un fichier de log (mode asynchrone non-bloquant)
     */
    writeToFile(filePath, level, message) {
        try {
            const timestamp = this.getTimestamp();
            const logLine = `${timestamp} [${level}] ${message}\n`;
            
            fs.appendFile(filePath, logLine, 'utf8', (err) => {
                if (err) {
                    console.error(chalk.red('❌ Erreur écriture log:'), err.message);
                }
            });
        } catch (error) {
            console.error(chalk.red('❌ Erreur écriture log:'), error.message);
        }
    }

    /**
     * LOG INFO (bleu) 📘
     */
    info(...args) {
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.blue(timestamp),
            chalk.blue('[INFO]'),
            message
        );
        
        // Fichier combined.log
        this.writeToFile(this.combinedLogPath, 'INFO', message);
    }

    /**
     * LOG SUCCESS (vert) ✅
     */
    success(...args) {
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.green(timestamp),
            chalk.green('[SUCCESS]'),
            message
        );
        
        // Fichier combined.log
        this.writeToFile(this.combinedLogPath, 'SUCCESS', message);
    }

    /**
     * LOG WARNING (jaune) ⚠️
     */
    warn(...args) {
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.yellow(timestamp),
            chalk.yellow('[WARN]'),
            message
        );
        
        // Fichier combined.log
        this.writeToFile(this.combinedLogPath, 'WARN', message);
    }

    /**
     * LOG ERROR (rouge) ❌
     */
    error(...args) {
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.red(timestamp),
            chalk.red('[ERROR]'),
            message
        );
        
        // Fichiers combined.log ET error.log
        this.writeToFile(this.combinedLogPath, 'ERROR', message);
        this.writeToFile(this.errorLogPath, 'ERROR', message);
    }

    /**
     * LOG DEBUG (magenta) 🔍
     * Uniquement si LOG_LEVEL=debug dans .env
     */
    debug(...args) {
        if (this.logLevel !== 'debug') return;
        
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.magenta(timestamp),
            chalk.magenta('[DEBUG]'),
            message
        );
        
        // Fichier debug.log
        this.writeToFile(this.debugLogPath, 'DEBUG', message);
    }

    /**
     * LOG COMMAND (cyan) 🎮
     * Pour tracer les commandes exécutées
     */
    command(...args) {
        const message = args.join(' ');
        const timestamp = this.getTimestamp();
        
        // Console avec couleur
        console.log(
            chalk.cyan(timestamp),
            chalk.cyan('[COMMAND]'),
            message
        );
        
        // Fichier combined.log
        this.writeToFile(this.combinedLogPath, 'COMMAND', message);
    }

    /**
     * Nettoyer les vieux logs (optionnel)
     * Supprime les logs de plus de X jours
     */
    cleanOldLogs(daysToKeep = 7) {
        try {
            const files = fs.readdirSync(this.logsDir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

            for (const file of files) {
                if (file === '.gitkeep') continue; // Ne pas supprimer .gitkeep
                
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;

                if (age > maxAge && file.endsWith('.log')) {
                    fs.unlinkSync(filePath);
                    this.info(`🗑️ Log supprimé (trop ancien): ${file}`);
                }
            }
        } catch (error) {
            this.error('Erreur nettoyage logs:', error.message);
        }
    }

    /**
     * Obtenir la taille actuelle des logs
     */
    getLogsSize() {
        try {
            const files = fs.readdirSync(this.logsDir);
            let totalSize = 0;
            
            for (const file of files) {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            }
            
            // Convertir en MB
            return (totalSize / 1024 / 1024).toFixed(2);
        } catch (error) {
            this.error('Erreur calcul taille logs:', error.message);
            return 0;
        }
    }
}

// Exporter une instance unique (Singleton)
module.exports = new Logger();

const db = require('../database/database');
const logger = require('../utils/logger');

/**
 * Service de gestion des cases (infractions cumulatives)
 */
class CaseService {
    /**
     * Ajouter une case à un utilisateur
     */
    static addCase(guildId, userId, moderatorId, reason, type = 'manual') {
        try {
            const createdAt = new Date().toISOString();
            // Les cases expirent après 7 jours
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const stmt = db.db.prepare(`
                INSERT INTO cases (guild_id, user_id, moderator_id, reason, type, created_at, expires_at, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `);

            const result = stmt.run(guildId, userId, moderatorId, reason, type, createdAt, expiresAt);

            logger.info(`[Cases] Case ajoutée pour ${userId} dans ${guildId}`);
            return result.lastInsertRowid;
        } catch (err) {
            logger.error('[Cases] Erreur lors de l\'ajout:', err);
            return null;
        }
    }

    /**
     * Obtenir toutes les cases actives d'un utilisateur
     */
    static getActiveCases(guildId, userId) {
        try {
            const now = new Date().toISOString();
            const stmt = db.db.prepare(`
                SELECT * FROM cases 
                WHERE guild_id = ? AND user_id = ? AND active = 1 AND expires_at > ?
                ORDER BY created_at DESC
            `);

            return stmt.all(guildId, userId, now);
        } catch (err) {
            logger.error('[Cases] Erreur lors de la récupération:', err);
            return [];
        }
    }

    /**
     * Obtenir le nombre de cases actives
     */
    static getActiveCaseCount(guildId, userId) {
        try {
            const cases = this.getActiveCases(guildId, userId);
            return cases.length;
        } catch (err) {
            logger.error('[Cases] Erreur lors du comptage:', err);
            return 0;
        }
    }

    /**
     * Obtenir toutes les cases (actives et expirées)
     */
    static getAllCases(guildId, userId) {
        try {
            const stmt = db.db.prepare(`
                SELECT * FROM cases 
                WHERE guild_id = ? AND user_id = ?
                ORDER BY created_at DESC
            `);

            return stmt.all(guildId, userId);
        } catch (err) {
            logger.error('[Cases] Erreur lors de la récupération:', err);
            return [];
        }
    }

    /**
     * Supprimer une case spécifique
     */
    static removeCase(caseId) {
        try {
            const stmt = db.db.prepare('UPDATE cases SET active = 0 WHERE id = ?');
            stmt.run(caseId);

            logger.info(`[Cases] Case ${caseId} supprimée`);
            return true;
        } catch (err) {
            logger.error('[Cases] Erreur lors de la suppression:', err);
            return false;
        }
    }

    /**
     * Réinitialiser toutes les cases d'un utilisateur
     */
    static resetCases(guildId, userId) {
        try {
            const stmt = db.db.prepare('UPDATE cases SET active = 0 WHERE guild_id = ? AND user_id = ?');
            const result = stmt.run(guildId, userId);

            logger.info(`[Cases] ${result.changes} case(s) réinitialisée(s) pour ${userId}`);
            return result.changes;
        } catch (err) {
            logger.error('[Cases] Erreur lors de la réinitialisation:', err);
            return 0;
        }
    }

    /**
     * Nettoyer les cases expirées (appelé périodiquement)
     */
    static cleanExpiredCases() {
        try {
            const now = new Date().toISOString();
            const stmt = db.db.prepare('UPDATE cases SET active = 0 WHERE expires_at < ? AND active = 1');
            const result = stmt.run(now);

            if (result.changes > 0) {
                logger.info(`[Cases] ${result.changes} case(s) expirée(s) nettoyée(s)`);
            }

            return result.changes;
        } catch (err) {
            logger.error('[Cases] Erreur lors du nettoyage:', err);
            return 0;
        }
    }

    /**
     * Appliquer une sanction automatique basée sur le nombre de cases
     */
    static async applyAutoSanction(member, caseCount) {
        try {
            const guild = member.guild;

            // 3 cases = Mute 1h
            if (caseCount === 3) {
                try {
                    await member.timeout(60 * 60 * 1000, 'Auto-sanction: 3 cases');
                    logger.info(`[Cases] ${member.user.tag} mute 1h (3 cases)`);
                    return { action: 'mute', duration: '1h' };
                } catch (e) {
                    logger.error('[Cases] Erreur mute:', e);
                }
            }

            // 5 cases = Kick
            else if (caseCount === 5) {
                try {
                    await member.kick('Auto-sanction: 5 cases');
                    logger.info(`[Cases] ${member.user.tag} kick (5 cases)`);
                    return { action: 'kick' };
                } catch (e) {
                    logger.error('[Cases] Erreur kick:', e);
                }
            }

            // 7 cases = Ban
            else if (caseCount >= 7) {
                try {
                    await member.ban({ reason: 'Auto-sanction: 7+ cases' });
                    logger.info(`[Cases] ${member.user.tag} ban (7+ cases)`);
                    return { action: 'ban' };
                } catch (e) {
                    logger.error('[Cases] Erreur ban:', e);
                }
            }

            return null;
        } catch (err) {
            logger.error('[Cases] Erreur lors de l\'auto-sanction:', err);
            return null;
        }
    }
}

module.exports = CaseService;

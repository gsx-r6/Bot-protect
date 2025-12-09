const PERMISSIONS = require('../config/permissions');
const logger = require('./logger');

// Stockage temporaire des usages pour le rate limit (en mémoire)
// Format: { userID: { commandName: { count: 0, resetTime: timestamp } } }
const rateLimits = new Map();

// Nettoyage périodique des rate limits expirés
setInterval(() => {
    const now = Date.now();
    for (const [userId, commands] of rateLimits.entries()) {
        for (const [cmd, data] of Object.entries(commands)) {
            if (data.resetTime < now) {
                delete commands[cmd];
            }
        }
        if (Object.keys(commands).length === 0) {
            rateLimits.delete(userId);
        }
    }
}, 60000);

class PermissionHandler {

    /**
     * Récupère le niveau de permission d'un membre.
     * Plus le niveau est BAS (1), plus il est ÉLEVÉ en hiérarchie.
     * @param {GuildMember} member 
     * @returns {Object|null} L'objet niveau (avec .level, .name) ou null si aucun grade
     */
    static getMemberLevel(member) {
        if (member.id === PERMISSIONS.OWNER_ID) return { level: 0, name: 'Owner', limits: { ban: Infinity, kick: Infinity, mute: Infinity } };

        // On cherche le niveau le plus haut (donc le plus petit chiffre)
        let bestLevel = null;

        for (const [lvlStr, data] of Object.entries(PERMISSIONS.LEVELS)) {
            const levelNum = parseInt(lvlStr);
            // Vérifie si le membre a un des rôles de ce niveau
            if (member.roles.cache.hasAny(...data.roles)) {
                if (!bestLevel || levelNum < bestLevel.level) {
                    bestLevel = data;
                }
            }
        }
        return bestLevel;
    }

    /**
     * Vérifie si l'exécuteur peut agir sur la cible (Hiérarchie).
     * @param {GuildMember} executor 
     * @param {GuildMember} target 
     * @returns {boolean} True si autorisé
     */
    static checkHierarchy(executor, target) {
        if (executor.id === PERMISSIONS.OWNER_ID) return true;
        if (target.id === PERMISSIONS.OWNER_ID) return false;
        if (executor.id === target.id) return false; // Ne peut pas s'auto-sanctionner

        const executorLevel = this.getMemberLevel(executor);
        const targetLevel = this.getMemberLevel(target);

        // Si l'exécuteur n'a aucun grade listé, il ne peut rien faire sur les gradés
        if (!executorLevel) return false;

        // Si la cible n'a aucun grade, un gradé peut agir (sauf si la cible a des perms admin via Discord, géré ailleurs)
        if (!targetLevel) return true;

        // Règle: Niveau 1 > Niveau 2. Donc executor.level doit être < target.level
        return executorLevel.level < targetLevel.level;
    }

    /**
     * Vérifie et incrémente la limite d'utilisation d'une commande.
     * @param {GuildMember} executor 
     * @param {string} commandType 'ban', 'kick', 'mute'
     * @returns {boolean} True si autorisé (sous la limite), False si bloqué
     */
    static checkRateLimit(executor, commandType) {
        if (executor.id === PERMISSIONS.OWNER_ID) return true;

        const level = this.getMemberLevel(executor);
        if (!level || !level.limits || level.limits[commandType] === undefined) return false; // Pas de droit par défaut

        const limit = level.limits[commandType];
        if (limit === Infinity) return true;
        if (limit === 0) return false;

        const now = Date.now();
        const userId = executor.id;

        if (!rateLimits.has(userId)) rateLimits.set(userId, {});
        const userLimits = rateLimits.get(userId);

        if (!userLimits[commandType] || userLimits[commandType].resetTime < now) {
            // Reset ou initialisation
            userLimits[commandType] = {
                count: 0,
                resetTime: now + (60 * 60 * 1000) // Reset toutes les heures
            };
        }

        if (userLimits[commandType].count >= limit) {
            return false; // Limite atteinte
        }

        userLimits[commandType].count++;
        return true;
    }

    /**
     * Retourne le nombre d'utilisations restantes
     */
    static getRemainingUses(executor, commandType) {
        const level = this.getMemberLevel(executor);
        if (!level || !level.limits) return 0;
        const limit = level.limits[commandType];
        if (limit === Infinity) return 'Illimité';

        const userLimits = rateLimits.get(executor.id);
        if (!userLimits || !userLimits[commandType]) return limit;

        return Math.max(0, limit - userLimits[commandType].count);
    }
}

module.exports = PermissionHandler;

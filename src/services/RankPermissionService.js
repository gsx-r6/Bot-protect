const db = require('../database/database');
const logger = require('../utils/logger');

class RankPermissionService {
    constructor() {
        this.cache = new Map();
    }

    canGiveRole(guild, executorMember, targetRoleId, targetMember = null, isRemoval = false) {
        if (!guild || !executorMember || !targetRoleId) {
            return { canGive: false, reason: 'Paramètres invalides' };
        }

        const targetRole = guild.roles.cache.get(targetRoleId);
        if (!targetRole) {
            return { canGive: false, reason: 'Rôle cible introuvable' };
        }

        if (targetMember && !isRemoval) {
            try {
                const isBlacklisted = db.db.prepare('SELECT * FROM role_blacklist WHERE guild_id = ? AND user_id = ?')
                    .get(guild.id, targetMember.id);

                if (isBlacklisted) {
                    return { canGive: false, reason: 'Ce membre est sous protection blr (blacklist role). Utilisez +unblr pour débloquer.' };
                }
            } catch (err) {
                logger.error('Error checking blacklist: ' + err.message);
            }
        }

        if (executorMember.id === guild.ownerId) {
            return { canGive: true };
        }

        if (executorMember.permissions.has('Administrator')) {
            return { canGive: true };
        }

        const SPECIAL_ADMIN_ROLE = '1434622699547656295';
        const MAX_RANK_FOR_SPECIAL = '1434622692429926560';
        
        if (executorMember.roles.cache.has(SPECIAL_ADMIN_ROLE)) {
            const maxRankRole = guild.roles.cache.get(MAX_RANK_FOR_SPECIAL);
            if (maxRankRole && targetRole.position > maxRankRole.position) {
                return { canGive: false, reason: `Avec le rôle <@&${SPECIAL_ADMIN_ROLE}>, vous pouvez rank jusqu'à <@&${MAX_RANK_FOR_SPECIAL}>` };
            }
            return { canGive: true };
        }

        const guildId = guild.id;
        const executorRoles = executorMember.roles.cache.sort((a, b) => b.position - a.position);

        const restrictedRoleIds = [
            '1434622725388763271', '1434622727209226404', '1434622734003867689',
            '1434622733072994369', '1434622734897516687', '1434622732087070792',
            '1434622735455096834', '1434622714936692847', '1434622699547656295',
            '1436031920277291181', '1436479737601200210'
        ];

        if (restrictedRoleIds.includes(targetRoleId)) {
            const highRoleIds = [
                '1434622673454891191', '1434622678983249950', '1434622681629851718',
                '1434622680455184395', '1434633322071588884', '1434622675266830610',
                '1434622672532410591', '1434622674356670625'
            ];

            const hasHighRole = executorRoles.some(role => highRoleIds.includes(role.id));
            const highestHighRole = guild.roles.cache.get('1434622673454891191');
            
            if (!hasHighRole && (!highestHighRole || executorMember.roles.highest.position <= highestHighRole.position)) {
                return { canGive: false, reason: 'Ce rôle ne peut être donné que par les rôles au-dessus de <@&1434622673454891191>' };
            }
        }

        const specialRoleId = '1434622709513588826';
        if (targetRoleId === specialRoleId) {
            const highestHighRole = guild.roles.cache.get('1434622673454891191');
            if (!highestHighRole || executorMember.roles.highest.position <= highestHighRole.position) {
                return { canGive: false, reason: 'Le rôle <@&1434622709513588826> ne peut être donné que par les rôles au-dessus de <@&1434622673454891191>' };
            }
        }

        const topRoleIds = [
            '1434622673454891191', '1434622678983249950', '1434622681629851718',
            '1434622680455184395', '1434633322071588884', '1434622675266830610',
            '1434622672532410591', '1434622674356670625'
        ];

        const hasTopRole = executorRoles.some(role => topRoleIds.includes(role.id));
        if (hasTopRole) {
            if (targetRole.position >= executorMember.roles.highest.position) {
                return { canGive: false, reason: 'Vous ne pouvez pas donner un rôle égal ou supérieur au vôtre' };
            }
            return { canGive: true };
        }

        const exceptionRolePermissions = {
            '1434622699547656295': { canGiveAll: true },
            '1434622725388763271': { canGiveAll: true },
            '1434622727209226404': { canGiveAll: true },
            '1434622734003867689': { canGiveAll: true },
            '1434622733072994369': { canGiveAll: true },
            '1434622734897516687': { canGiveAll: true },
            '1434622732087070792': { canGiveAll: true },
            '1434622709513588826': { canGiveAll: true }
        };

        for (const executorRole of executorRoles.values()) {
            const exceptionPerm = exceptionRolePermissions[executorRole.id];
            if (exceptionPerm && exceptionPerm.canGiveAll) {
                if (targetRole.position > executorRole.position) {
                    return { canGive: true };
                }
            }
        }

        const hierarchyRoles = [
            '1434622770276466820',
            '1434622765608210593',
            '1434622761539469515',
            '1434622755910975671',
            '1434622750605181010',
            '1434622744548479159',
            '1434622722343698534',
            '1434622720242356384',
            '1434622705436459079',
            '1434622698721509579',
            '1434622696716636184',
            '1434622690207203338',
            '1434622694481072130',
            '1434622688340738059',
            '1434622693592010783',
            '1434622692429926560'
        ];

        const hierarchyMap = {
            '1434622765608210593': ['1434622770276466820'],
            '1434622761539469515': ['1434622770276466820', '1434622765608210593'],
            '1434622755910975671': ['1434622770276466820', '1434622765608210593', '1434622761539469515'],
            '1434622750605181010': ['1434622770276466820', '1434622765608210593', '1434622761539469515', '1434622755910975671'],
            '1434622744548479159': ['1434622770276466820', '1434622765608210593', '1434622761539469515', '1434622755910975671', '1434622750605181010']
        };

        for (const executorRole of executorRoles.values()) {
            if (hierarchyMap[executorRole.id]) {
                if (hierarchyMap[executorRole.id].includes(targetRoleId)) {
                    return { canGive: true };
                }
            }

            const dbPermission = db.getRankPermission(guildId, executorRole.id);
            if (dbPermission) {
                try {
                    const allowedRoles = JSON.parse(dbPermission.can_give_roles || '[]');
                    if (allowedRoles.includes(targetRoleId)) {
                        return { canGive: true };
                    }
                } catch (err) {
                    logger.error(`Error parsing rank permissions for role ${executorRole.id}: ${err.message}`);
                }
            }
        }

        return { canGive: false, reason: 'Vous n\'avez pas la permission de donner ce rôle selon la hiérarchie' };
    }

    getAvailableRolesToGive(guild, executorMember) {
        if (!guild || !executorMember) return [];

        const allRoles = guild.roles.cache.filter(role => !role.managed && role.id !== guild.id);
        const availableRoles = [];

        for (const role of allRoles.values()) {
            const check = this.canGiveRole(guild, executorMember, role.id);
            if (check.canGive) {
                availableRoles.push(role);
            }
        }

        return availableRoles.sort((a, b) => b.position - a.position);
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new RankPermissionService();

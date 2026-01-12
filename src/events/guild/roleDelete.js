const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildRoleDelete,
    once: false,

    async execute(role, client) {
        try {
            logger.info(`🗑️ Rôle supprimé: ${role.name} (${role.id})`);

            // SECURITY CHECK (ROLE PROTECTION)
            if (client.roleProtector) {
                await client.roleProtector.onRoleDelete(role);
            }

            if (client.logs) {
                await client.logs.logRoles(role.guild, 'REMOVE', { role });
            }
        } catch (e) {
            logger.error('[RoleDelete] Error:', e);
        }
    }
};

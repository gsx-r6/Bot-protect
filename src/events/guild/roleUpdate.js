const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildRoleUpdate,
    once: false,

    async execute(oldRole, newRole, client) {
        try {
            logger.info(`✏️ Rôle modifié: ${newRole.name} (${newRole.id})`);
            if (client.logs) {
                await client.logs.logRoles(newRole.guild, 'EDIT', { role: newRole, before: oldRole, after: newRole });
            }
        } catch (e) {
            logger.error('[RoleUpdate] Error:', e);
        }
    }
};

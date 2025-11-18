const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildRoleCreate,
    once: false,

    async execute(role, client) {
        try {
            logger.info(`🎭 Rôle créé: ${role.name} (${role.id})`);
            if (client.logs) {
                await client.logs.logRoles(role.guild, 'ADD', { role });
            }
        } catch (e) {
            logger.error('[RoleCreate] Error:', e);
        }
    }
};

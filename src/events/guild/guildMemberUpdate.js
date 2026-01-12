const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,

    async execute(oldMember, newMember, client) {
        try {
            // SECURITY CHECK (MEMBER ROLE PROTECTION)
            if (client.memberProtector) {
                await client.memberProtector.onMemberUpdate(oldMember, newMember);
            }

            // Other member update logic (logs, etc.)
            if (client.logs) {
                // Ensure roles were changed
                const oldRoles = oldMember.roles.cache;
                const newRoles = newMember.roles.cache;
                if (!oldRoles.equals(newRoles)) {
                    await client.logs.logMemberUpdate(newMember, oldMember, newMember);
                }
            }
        } catch (error) {
            logger.error('[GuildMemberUpdate] Error:', error);
        }
    }
};

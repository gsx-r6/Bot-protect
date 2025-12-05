const logger = require('../utils/logger');

class RoleProtector {
    constructor(client) {
        this.client = client;
    }

    init() {
        this.client.on('roleUpdate', (oldRole, newRole) => this.onRoleUpdate(oldRole, newRole));
        logger.info('RoleProtector initialized');
    }

    onRoleUpdate(oldRole, newRole) {
        // Placeholder: log role changes. Real logic: detect deletions/modifications to protected roles and revert.
        logger.info(`RoleProtector: role ${oldRole.id} updated in guild ${oldRole.guild.id}`);
    }
}

module.exports = RoleProtector;

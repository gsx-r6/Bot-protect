const logger = require('../utils/logger');

class MemberProtector {
    constructor(client) {
        this.client = client;
        this.protected = new Set(); // store IDs of VIP members
    }

    init() {
        this.client.on('guildMemberUpdate', (oldMember, newMember) => this.onMemberUpdate(oldMember, newMember));
        logger.info('MemberProtector initialized');
    }

    onMemberUpdate(oldMember, newMember) {
        if (this.protected.has(newMember.id)) {
            // Prevent role removals or dangerous changes (implementation stub)
            logger.warn(`MemberProtector: protected member ${newMember.id} changed in guild ${newMember.guild.id}`);
        }
    }

    addProtected(id) { this.protected.add(id); }
    removeProtected(id) { this.protected.delete(id); }
}

module.exports = MemberProtector;

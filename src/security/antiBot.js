const logger = require('../utils/logger');

class AntiBot {
    constructor(client) {
        this.client = client;
    }

    init() {
        this.client.on('guildMemberAdd', (member) => this.onMemberAdd(member));
        logger.info('AntiBot initialized');
    }

    async onMemberAdd(member) {
        if (!member.user.bot) return;
        const autoAccept = process.env.ANTIBOT_AUTO_ACCEPT_FROM_ADMINS === 'true';
        if (autoAccept && member.guild.ownerId === member.user.id) return;
        // For now: log and optionally kick bots if policy enabled
        if (process.env.ANTIBOT_ENABLED === 'true') {
            logger.warn(`AntiBot: bot ${member.user.tag} joined guild ${member.guild.id}`);
            // Optionally kick non-whitelisted bots (whitelist management not implemented)
        }
    }
}

module.exports = AntiBot;

const logger = require('../utils/logger');

class AntiRaid {
    constructor(client) {
        this.client = client;
        this.joins = new Map();
    }

    init() {
        this.client.on('guildMemberAdd', (member) => this.onJoin(member));
        logger.info('AntiRaid initialized');
    }

    onJoin(member) {
        // Basic stub: count joins per timeframe
        const guild = member.guild.id;
        const now = Date.now();
        if (!this.joins.has(guild)) this.joins.set(guild, []);
        const arr = this.joins.get(guild);
        arr.push(now);
        // purge older than timeframe (10s default)
        const timeframe = parseInt(process.env.ANTIRAID_TIMEFRAME || '10000', 10);
        const threshold = parseInt(process.env.ANTIRAID_THRESHOLD || '10', 10);
        while (arr.length && now - arr[0] > timeframe) arr.shift();
        if (arr.length >= threshold) {
            logger.warn(`AntiRaid triggered in guild ${guild}: ${arr.length} joins within ${timeframe}ms`);
            // defensive actions could be implemented here (notify admins)
        }
    }
}

module.exports = AntiRaid;

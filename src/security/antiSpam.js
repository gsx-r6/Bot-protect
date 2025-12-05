const logger = require('../utils/logger');

class AntiSpam {
    constructor(client) {
        this.client = client;
        this.map = new Map();
    }

    init() {
        this.client.on('messageCreate', (msg) => this.onMessage(msg));
        logger.info('AntiSpam initialized');
    }

    onMessage(msg) {
        if (msg.author.bot) return;
        const key = `${msg.guild.id}:${msg.author.id}`;
        const now = Date.now();
        if (!this.map.has(key)) this.map.set(key, []);
        const arr = this.map.get(key);
        arr.push(now);
        const timeframe = parseInt(process.env.ANTISPAM_TIMEFRAME || '5000', 10);
        const threshold = parseInt(process.env.ANTISPAM_MESSAGE_THRESHOLD || '5', 10);
        while (arr.length && now - arr[0] > timeframe) arr.shift();
        if (arr.length >= threshold) {
            logger.warn(`AntiSpam: ${msg.author.tag} sent ${arr.length} messages in ${timeframe}ms in guild ${msg.guild.id}`);
            // escalation: warn/kick/timeout logic can be added here
        }
    }
}

module.exports = AntiSpam;

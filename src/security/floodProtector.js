const db = require('../database/database');
const logger = require('../utils/logger');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

class FloodProtector {
    constructor(client) {
        this.client = client;
        this.channelHistory = new Map(); // { channelId: [timestamps] }
        this.activeSlowModes = new Map(); // { channelId: timeout }

        // Configuration par défaut (UHQ)
        this.THRESHOLD = 15; // 15 messages
        this.TIMEFRAME = 5000; // en 5 secondes
        this.SLOWMODE_VALUE = 5; // 5 secondes de slowmode
        this.DURATION = 2 * 60 * 1000; // dure 2 minutes
    }

    init() {
        logger.info('FloodProtector service initialized (Stand-alone mode)');
    }

    async handleMessage(message) {
        if (!message.guild || message.author.bot) return;

        // Skip if authorized
        if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        const config = db.getAutomodConfig(message.guild.id);
        if (!config || !config.antiflood) return;

        const now = Date.now();
        const channelId = message.channel.id;

        if (!this.channelHistory.has(channelId)) this.channelHistory.set(channelId, []);
        const history = this.channelHistory.get(channelId);

        history.push(now);

        // Cleanup old timestamps
        const recent = history.filter(t => now - t < this.TIMEFRAME);
        this.channelHistory.set(channelId, recent);

        // Check threshold
        if (recent.length >= this.THRESHOLD && !this.activeSlowModes.has(channelId)) {
            await this.activateDynamicSlowMode(message.channel);
        }
    }

    async activateDynamicSlowMode(channel) {
        try {
            if (!channel.manageable) return;

            this.activeSlowModes.set(channel.id, true);

            // Activate SlowMode
            await channel.setRateLimitPerUser(this.SLOWMODE_VALUE, 'Dynamic Slow-Mode: Flood detected');

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ PROTECTION ANTI-FLOOD')
                .setDescription(`Un pic de messages a été détecté. Le **mode lent (${this.SLOWMODE_VALUE}s)** a été activé automatiquement pour 2 minutes.`)
                .setTimestamp();

            await channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => { }), 10000));

            logger.warn(`[FloodProtector] Dynamic Slow-Mode activated in #${channel.name} (${channel.guild.name})`);

            // Deactivate after duration
            setTimeout(async () => {
                try {
                    const currentChannel = this.client.channels.cache.get(channel.id);
                    if (currentChannel && currentChannel.manageable) {
                        await currentChannel.setRateLimitPerUser(0, 'Dynamic Slow-Mode: End of flood');
                        logger.info(`[FloodProtector] Dynamic Slow-Mode removed in #${currentChannel.name}`);
                    }
                } catch (e) { }
                this.activeSlowModes.delete(channel.id);
            }, this.DURATION);

        } catch (err) {
            logger.error(`[FloodProtector] Error:`, err);
            this.activeSlowModes.delete(channel.id);
        }
    }
}

module.exports = FloodProtector;

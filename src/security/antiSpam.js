const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder } = require('discord.js');

class AntiSpam {
    constructor(client) {
        this.client = client;
        this.messageMap = new Map();
        this.warnedUsers = new Map();
        this.cleanupInterval = null;
    }

    init() {
        this.client.on('messageCreate', (msg) => this.onMessage(msg));
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        logger.info('AntiSpam initialized with enforcement enabled');
    }

    async onMessage(msg) {
        if (msg.author.bot) return;
        if (!msg.guild) return;
        if (!msg.member) return;

        const config = db.getAutomodConfig(msg.guild.id);
        if (!config || !config.antispam) return;

        if (msg.member.permissions.has('ManageMessages')) return;

        const key = `${msg.guild.id}:${msg.author.id}`;
        const now = Date.now();

        if (!this.messageMap.has(key)) this.messageMap.set(key, []);
        const arr = this.messageMap.get(key);
        arr.push(now);

        const timeframe = parseInt(process.env.ANTISPAM_TIMEFRAME || '5000', 10);
        const threshold = parseInt(process.env.ANTISPAM_MESSAGE_THRESHOLD || '5', 10);

        while (arr.length && now - arr[0] > timeframe) arr.shift();

        if (arr.length >= threshold) {
            await this.enforceAction(msg, arr.length, timeframe);
            this.messageMap.set(key, []);
        }
    }

    async enforceAction(msg, messageCount, timeframe) {
        const member = msg.member;
        const guild = msg.guild;

        try {
            const timeoutDuration = 5 * 60 * 1000;
            await member.timeout(timeoutDuration, `Anti-Spam: ${messageCount} messages in ${timeframe}ms`);

            logger.warn(`[AntiSpam] ${msg.author.tag} timed out for spamming in ${guild.name}`);

            const logChannels = db.getLoggerChannels(guild.id);
            if (logChannels?.automod_log) {
                const logChannel = guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF6600')
                        .setTitle('🚫 Anti-Spam Triggered')
                        .setDescription(`${member} a été mute automatiquement pour spam`)
                        .addFields(
                            { name: '👤 Utilisateur', value: `${msg.author.tag} (${msg.author.id})`, inline: true },
                            { name: '📊 Messages', value: `${messageCount} en ${timeframe}ms`, inline: true },
                            { name: '⏱️ Durée mute', value: '5 minutes', inline: true },
                            { name: '📍 Salon', value: `${msg.channel}`, inline: true }
                        )
                        .setThumbnail(msg.author.displayAvatarURL())
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle('🚫 Vous avez été mute')
                    .setDescription(`Vous avez été temporairement mute sur **${guild.name}** pour spam.`)
                    .addFields(
                        { name: '⏱️ Durée', value: '5 minutes' },
                        { name: '📝 Raison', value: `${messageCount} messages envoyés trop rapidement` }
                    );
                await msg.author.send({ embeds: [dmEmbed] });
            } catch (e) {}

        } catch (err) {
            logger.error('[AntiSpam] Failed to timeout user:', err.message);
        }
    }

    cleanup() {
        const now = Date.now();
        const maxAge = 60000;

        for (const [key, timestamps] of this.messageMap.entries()) {
            const recent = timestamps.filter(t => now - t < maxAge);
            if (recent.length === 0) {
                this.messageMap.delete(key);
            } else {
                this.messageMap.set(key, recent);
            }
        }

        for (const [key, time] of this.warnedUsers.entries()) {
            if (now - time > 300000) {
                this.warnedUsers.delete(key);
            }
        }
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

module.exports = AntiSpam;

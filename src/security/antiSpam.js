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

        const timeframe = config.antispam_timeframe || parseInt(process.env.ANTISPAM_TIMEFRAME || '5000', 10);
        const threshold = config.antispam_threshold || 5;

        while (arr.length && now - arr[0] > timeframe) arr.shift();

        if (arr.length >= threshold) {
            await this.enforceAction(msg, arr.length, timeframe, config.antispam_action || 'mute');
            this.messageMap.set(key, []);
        }
    }

    async enforceAction(msg, messageCount, timeframe, action) {
        const member = msg.member;
        const guild = msg.guild;

        try {
            logger.warn(`[AntiSpam] ${msg.author.tag} triggered limit (${messageCount} msgs) - Action: ${action}`);

            let actionText = '';

            switch (action.toLowerCase()) {
                case 'warn':
                    db.addWarning(guild.id, member.id, this.client.user.id, `Anti-Spam: ${messageCount} messages in ${timeframe}ms`);
                    actionText = 'Avertissement';
                    break;

                case 'kick':
                    if (member.kickable) {
                        await member.kick(`Anti-Spam: ${messageCount} messages in ${timeframe}ms`);
                        actionText = 'Expulsion';
                    } else {
                        actionText = 'Expulsion (Echec - Permissions)';
                    }
                    break;

                case 'ban':
                    if (member.bannable) {
                        await member.ban({ reason: `Anti-Spam: ${messageCount} messages in ${timeframe}ms` });
                        actionText = 'Bannissement';
                    } else {
                        actionText = 'Ban (Echec - Permissions)';
                    }
                    break;

                case 'mute':
                default:
                    const timeoutDuration = 5 * 60 * 1000;
                    if (member.moderatable) {
                        await member.timeout(timeoutDuration, `Anti-Spam: ${messageCount} messages in ${timeframe}ms`);
                        actionText = 'Mute (5 min)';
                    } else {
                        actionText = 'Mute (Echec - Permissions)';
                    }
                    break;
            }

            const logChannels = db.getLoggerChannels(guild.id);
            if (logChannels?.automod_log) {
                const logChannel = guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000') // Force consistent security red
                        .setTitle('🚫 Anti-Spam Triggered')
                        .setDescription(`${member} a déclenché l'anti-spam.`)
                        .addFields(
                            { name: '👤 Utilisateur', value: `${msg.author.tag} (${msg.author.id})`, inline: true },
                            { name: '📊 Messages', value: `${messageCount} en ${timeframe}ms`, inline: true },
                            { name: '🛠️ Action', value: actionText, inline: true },
                            { name: '📍 Salon', value: `${msg.channel}`, inline: true }
                        )
                        .setThumbnail(msg.author.displayAvatarURL())
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });

                    // Also fire centralized security log
                    if (this.client.logs) {
                        await this.client.logs.logSecurity(guild, 'ANTI-SPAM', {
                            user: msg.author,
                            severity: 'HAUTE',
                            description: `${msg.author.tag} a envoyé ${messageCount} messages en ${timeframe}ms. Action appliquée: ${actionText}`
                        });
                    }
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle(`🚫 Anti-Spam: ${actionText}`)
                    .setDescription(`Vous avez déclenché l'anti-spam sur **${guild.name}**.\nAction: **${actionText}**`)
                    .addFields(
                        { name: '📝 Raison', value: `${messageCount} messages envoyés trop rapidement` }
                    );
                await msg.author.send({ embeds: [dmEmbed] });
            } catch (e) { }

        } catch (err) {
            logger.error('[AntiSpam] Failed to enforce action:', err.message);
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

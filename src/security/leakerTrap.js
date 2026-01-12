const db = require('../database/database');
const logger = require('../utils/logger');
const Response = require('../utils/Response');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

class LeakerTrap {
    constructor(client) {
        this.client = client;
    }

    init() {
        logger.info('LeakerTrap service initialized (Stand-alone mode)');
    }

    async handleMessage(message) {
        if (!message.guild || message.author.bot) return;

        const config = db.getGuildConfig(message.guild.id);
        if (!config || !config.leakertrap_channel_id) return;

        if (message.channel.id === config.leakertrap_channel_id) {
            await this.executeTrap(message.member, 'Message sent in LeakerTrap channel');
        }
    }

    async handleChannelDelete(channel) {
        if (!channel.guild) return;
        const config = db.getGuildConfig(channel.guild.id);
        if (config && config.leakertrap_channel_id === channel.id) {
            db.setGuildConfig(channel.guild.id, 'leakertrap_channel_id', null);
            logger.info(`[LeakerTrap] Trap channel deleted in ${channel.guild.name}, config cleared.`);
        }
    }

    async executeTrap(member, reason) {
        try {
            const guild = member.guild;

            // 1. Log carefully
            logger.warn(`[LeakerTrap] TRAP TRIGGERED by ${member.user.tag} in ${guild.name}. Reason: ${reason}`);

            // 2. Ban the offender
            if (member.bannable) {
                await member.ban({ deleteMessageSeconds: 604800, reason: `[🛡️ UHQ SECURITY] Activation du salon piège (Leaker-Trap). Comportement automatisé détecté.` });

                // 3. Notify Logs
                const logChannels = db.getLoggerChannels(guild.id);
                if (logChannels?.security_log || logChannels?.mod_log) {
                    const logChannelId = logChannels.security_log || logChannels.mod_log;
                    const logChannel = guild.channels.cache.get(logChannelId);

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('💀 LEAKER-TRAP DÉCLENCHÉ')
                            .setDescription(`Un utilisateur (probablement un selfbot/nuker) a été banni instantanément.`)
                            .addFields(
                                { name: '👤 Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
                                { name: '🛡️ Action', value: 'BAN PERMANENT', inline: true },
                                { name: '📝 Raison', value: reason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'UHQ Security System' });

                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } else {
                logger.error(`[LeakerTrap] Failed to ban ${member.user.tag}: Missing permissions.`);
            }
        } catch (err) {
            logger.error(`[LeakerTrap] Error executing trap:`, err);
        }
    }
}

module.exports = LeakerTrap;

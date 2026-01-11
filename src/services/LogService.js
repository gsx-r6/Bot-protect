/**
 * LogService - Système centralisé de logging par canal
 * Chaque action est envoyée au canal approprié via des embeds formatés
 */

const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), 'data', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    try { fs.mkdirSync(LOGS_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

const LOG_COLORS = {
    MODERATION: '#FF4343', // Rouge vif
    SECURITY: '#FF0000',   // Rouge alerte
    MEMBER: '#7289DA',     // Blurple
    MESSAGE: '#FAA61A',    // Orange
    VOICE: '#43B581',      // Vert
    CHANNELS: '#9B59B6',   // Violet
    GUILD: '#0099FF'       // Bleu
};

class LogService {
    constructor(client) {
        this.client = client;
        this.colors = LOG_COLORS;
        this.logChannelIds = {
            moderation: process.env.LOG_CHANNEL_MODERATION || '',
            member: process.env.LOG_CHANNEL_MEMBER || '',
            message: process.env.LOG_CHANNEL_MESSAGE || '',
            voice: process.env.LOG_CHANNEL_VOICE || '',
            guild: process.env.LOG_CHANNEL_GUILD || '',
            security: process.env.LOG_CHANNEL_SECURITY || '',
            roles: process.env.LOG_CHANNEL_ROLES || '',
            channels: process.env.LOG_CHANNEL_CHANNELS || ''
        };
        this.channelsCache = new Map();
        this.configCache = new Map();
        this.cacheTTL = 5 * 60 * 1000;
        this.isInitialized = false;
    }

    getConfig(guildId) {
        const cacheKey = `config_${guildId}`;
        const cached = this.configCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const db = require('../database/database');
        const config = db.getLoggerChannels(guildId);
        this.configCache.set(cacheKey, { data: config, timestamp: Date.now() });
        return config;
    }

    clearConfigCache(guildId) {
        this.configCache.delete(`config_${guildId}`);
        // Also clear channels cache for this guild if needed
        for (const key of this.channelsCache.keys()) {
            if (key.startsWith(`${guildId}_`)) {
                this.channelsCache.delete(key);
            }
        }
    }

    setChannel(guildId, logType, channelId) {
        const db = require('../database/database');
        db.setLoggerChannel(guildId, logType, channelId);
        this.clearConfigCache(guildId);
    }

    removeChannel(guildId, logType) {
        const db = require('../database/database');
        db.removeLoggerChannel(guildId, logType);
        this.clearConfigCache(guildId);
    }

    async getChannel(guild, channelId) {
        if (!channelId) return null;

        const cacheKey = `${guild.id}_${channelId}`;
        const cached = this.channelsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.channel;
        }

        let channel = guild.channels.cache.get(channelId);

        if (!channel) {
            try {
                channel = await guild.channels.fetch(channelId);
            } catch (error) {
                return null;
            }
        }

        if (channel) {
            this.channelsCache.set(cacheKey, { channel, timestamp: Date.now() });
        }

        return channel;
    }

    async sendLog(guild, logType, embed) {
        const config = this.getConfig(guild.id);
        if (!config) return false;

        const channelId = config[logType];
        if (!channelId) return false;

        try {
            const channel = await this.getChannel(guild, channelId);
            if (!channel || !channel.isTextBased()) return false;

            const permissions = channel.permissionsFor(guild.members.me);
            if (!permissions?.has('ViewChannel') || !permissions?.has('SendMessages') || !permissions?.has('EmbedLinks')) {
                return false;
            }

            await channel.send({ embeds: [embed] }).catch(() => { });
            return true;
        } catch (error) {
            return false;
        }
    }

    async logAutomod(guild, type, data) {
        if (!guild) return;
        return this.sendLog(guild, 'automod_log', data);
    }

    /**
     * Envoyer un log de modération (ban, kick, mute, warn)
     */
    async logModeration(guild, action, details) {
        if (!this.logChannelIds.moderation) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.MODERATION)
            .setTitle(`🛡️ ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        if (details.user) {
            embed.addFields(
                { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})`, inline: true }
            );
        }

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Modérateur', value: details.moderator.tag, inline: true }
            );
        }

        if (details.reason) {
            embed.addFields(
                { name: '📝 Raison', value: details.reason }
            );
        }

        if (details.duration) {
            embed.addFields(
                { name: '⏱️ Durée', value: details.duration, inline: true }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannelIds.moderation, embed);
    }

    /**
     * Envoyer un log membre (join/leave)
     */
    async logMember(guild, action, details) {
        if (!this.logChannelIds.member) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.MEMBER)
            .setTitle(`${action === 'JOIN' ? '✅ Membre arrivé' : '❌ Membre parti'}`)
            .setThumbnail(details.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})` },
            { name: '📅 Compte créé', value: `<t:${Math.floor(details.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '⏰ Serveur rejoint', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        );

        if (details.memberCount) {
            embed.addFields(
                { name: '👥 Total membres', value: details.memberCount.toString(), inline: true }
            );
        }

        return this.sendToChannel(guild, this.logChannelIds.member, embed);
    }

    /**
     * Envoyer un log message (delete/edit)
     */
    async logMessage(guild, action, details) {
        if (!this.logChannelIds.message) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.MESSAGE)
            .setTitle(`${action === 'DELETE' ? '❌ Message supprimé' : '✏️ Message modifié'}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        embed.addFields(
            { name: '👤 Auteur', value: `${details.author.tag} (${details.author.id})` },
            { name: '#️⃣ Canal', value: `<#${details.channel.id}>`, inline: true },
            { name: '🔗 Message ID', value: details.messageId || 'N/A', inline: true }
        );

        if (action === 'DELETE' && details.content) {
            const contentTrunc = details.content.length > 1024 ? details.content.substring(0, 1021) + '...' : details.content;
            embed.addFields(
                { name: '📄 Contenu supprimé', value: `\`\`\`${contentTrunc}\`\`\`` }
            );
        }

        if (action === 'EDIT' && details.before && details.after) {
            const beforeTrunc = details.before.length > 512 ? details.before.substring(0, 509) + '...' : details.before;
            const afterTrunc = details.after.length > 512 ? details.after.substring(0, 509) + '...' : details.after;
            embed.addFields(
                { name: '❌ Avant', value: `\`\`\`${beforeTrunc}\`\`\`` },
                { name: '✅ Après', value: `\`\`\`${afterTrunc}\`\`\`` }
            );
        }

        return this.sendToChannel(guild, this.logChannelIds.message, embed);
    }

    /**
     * Envoyer un log voix (join/leave canal)
     */
    async logVoice(guild, action, details) {
        if (!this.logChannelIds.voice) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.VOICE)
            .setTitle(`${action === 'JOIN' ? '🎤 Connecté à la voix' : '🔇 Déconnecté de la voix'}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag}`, inline: true },
            { name: '🎙️ Canal', value: details.channel.name, inline: true }
        );

        if (details.duration) {
            embed.addFields(
                { name: '⏱️ Durée', value: details.duration, inline: true }
            );
        }

        return this.sendToChannel(guild, this.logChannelIds.voice, embed);
    }

    /**
     * Envoyer un log serveur (config changes)
     */
    async logGuild(guild, action, details) {
        if (!this.logChannelIds.guild) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.GUILD)
            .setTitle(`⚙️ ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Modérateur', value: details.moderator.tag, inline: true }
            );
        }

        if (details.before) {
            embed.addFields(
                { name: '❌ Avant', value: details.before.toString() }
            );
        }

        if (details.after) {
            embed.addFields(
                { name: '✅ Après', value: details.after.toString() }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannelIds.guild, embed);
    }

    /**
     * Envoyer un log sécurité (detections, alerts)
     */
    async logSecurity(guild, action, details) {
        if (!this.logChannelIds.security) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.SECURITY)
            .setTitle(`🔒 ALERTE SÉCURITÉ - ${action}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        if (details.user) {
            embed.addFields(
                { name: '👤 Utilisateur', value: `${details.user.tag} (${details.user.id})`, inline: true }
            );
        }

        if (details.severity) {
            embed.addFields(
                { name: '⚠️ Sévérité', value: details.severity, inline: true }
            );
        }

        if (details.description) {
            embed.addFields(
                { name: '📝 Description', value: details.description }
            );
        }

        if (details.extras) {
            Object.entries(details.extras).forEach(([key, value]) => {
                embed.addFields({ name: key, value: value.toString(), inline: true });
            });
        }

        return this.sendToChannel(guild, this.logChannelIds.security, embed);
    }

    /**
     * Envoyer un log rôles (assignation, suppression)
     */
    async logRoles(guild, action, details) {
        if (!this.logChannelIds.roles) return;

        const embed = new EmbedBuilder()
            .setColor(this.colors.CHANNELS) // Reuse standard violet
            .setTitle(`${action === 'ADD' ? '✅ Rôle ajouté' : '❌ Rôle retiré'}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        embed.addFields(
            { name: '👤 Utilisateur', value: `${details.user.tag}`, inline: true },
            { name: '🎭 Rôle', value: details.role.name, inline: true }
        );

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Par', value: details.moderator.tag, inline: true }
            );
        }

        if (details.reason) {
            embed.addFields(
                { name: '📝 Raison', value: details.reason }
            );
        }

        return this.sendToChannel(guild, this.logChannelIds.roles, embed);
    }

    /**
     * Envoyer un log canaux (create/delete/edit)
     */
    async logChannels(guild, action, details) {
        if (!this.logChannelIds.channels) return;

        const embed = new EmbedBuilder()
            .setColor(action === 'CREATE' ? '#00FF00' : action === 'DELETE' ? '#FF0000' : '#FFA500')
            .setTitle(`${action === 'CREATE' ? '✅ Canal créé' : action === 'DELETE' ? '❌ Canal supprimé' : '✏️ Canal modifié'}`)
            .setTimestamp()
            .setFooter({ text: 'Nami Protect ⚡' });

        embed.addFields(
            { name: '#️⃣ Canal', value: details.channel.name, inline: true },
            { name: '📊 Type', value: details.channel.type.charAt(0).toUpperCase() + details.channel.type.slice(1), inline: true }
        );

        if (details.moderator) {
            embed.addFields(
                { name: '👮 Par', value: details.moderator.tag, inline: true }
            );
        }

        if (action === 'EDIT' && details.before && details.after) {
            embed.addFields(
                { name: '❌ Avant', value: details.before.toString() },
                { name: '✅ Après', value: details.after.toString() }
            );
        }

        return this.sendToChannel(guild, this.logChannelIds.channels, embed);
    }

    // --- Legacy LoggerService Bridge Methods ---
    // (To be used by automated events)

    async logChannelCreate(channel) {
        if (!channel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        const embed = loggerEmbeds.channelCreate(this.client, channel);
        this.sendLog(channel.guild, 'channel_log', embed);
    }

    async logChannelDelete(channel) {
        if (!channel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        const embed = loggerEmbeds.channelDelete(this.client, channel);
        this.sendLog(channel.guild, 'channel_log', embed);
    }

    async logMessageDelete(message) {
        if (!message.guild || message.author?.bot) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        const embed = loggerEmbeds.messageDelete(this.client, message);
        this.sendLog(message.guild, 'message_log', embed);
    }

    async logMessageUpdate(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        const config = this.getConfig(newMessage.guild.id);
        if (!config || !config.message_log) return;

        const oldEmbed = loggerEmbeds.messageUpdateOld(this.client, oldMessage);
        const newEmbed = loggerEmbeds.messageUpdateNew(this.client, oldMessage, newMessage);

        const channel = await this.getChannel(newMessage.guild, config.message_log);
        if (channel && channel.isTextBased()) {
            channel.send({ embeds: [oldEmbed, newEmbed] }).catch(() => { });
        }
    }

    // Voice
    async logVoiceJoin(newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceJoin(this.client, newState));
    }
    async logVoiceLeave(oldState) {
        if (!oldState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(oldState.guild, 'voice_log', loggerEmbeds.voiceLeave(this.client, oldState));
    }
    async logVoiceSwitch(oldState, newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceSwitch(this.client, oldState, newState));
    }
    async logVoiceMute(newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceMute(this.client, newState));
    }
    async logVoiceUnmute(newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceUnmute(this.client, newState));
    }
    async logVoiceDeaf(newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceDeaf(this.client, newState));
    }
    async logVoiceUndeaf(newState) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceUndeaf(this.client, newState));
    }
    async logVoiceServerMute(newState, muted) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceServerMute(this.client, newState, muted));
    }
    async logVoiceServerDeaf(newState, deafened) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceServerDeaf(this.client, newState, deafened));
    }
    async logVoiceStream(newState, streaming) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceStream(this.client, newState, streaming));
    }
    async logVoiceVideo(newState, video) {
        if (!newState.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newState.guild, 'voice_log', loggerEmbeds.voiceVideo(this.client, newState, video));
    }

    // Members & Bans
    async logMemberJoin(member) {
        if (!member.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(member.guild, 'join_log', loggerEmbeds.guildMemberAdd(this.client, member));
    }
    async logMemberLeave(member) {
        if (!member.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(member.guild, 'leave_log', loggerEmbeds.guildMemberRemove(this.client, member));
    }
    async logBanAdd(ban) {
        if (!ban.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(ban.guild, 'ban_log', loggerEmbeds.guildBanAdd(this.client, ban));
    }
    async logBanRemove(ban) {
        if (!ban.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(ban.guild, 'ban_log', loggerEmbeds.guildBanRemove(this.client, ban));
    }

    // Emojis
    async logEmojiCreate(emoji) {
        if (!emoji.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(emoji.guild, 'emoji_log', loggerEmbeds.emojiCreate(this.client, emoji));
    }
    async logEmojiDelete(emoji) {
        if (!emoji.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(emoji.guild, 'emoji_log', loggerEmbeds.emojiDelete(this.client, emoji));
    }
    async logEmojiUpdate(oldEmoji, newEmoji) {
        if (!newEmoji.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newEmoji.guild, 'emoji_log', loggerEmbeds.emojiUpdate(this.client, oldEmoji, newEmoji));
    }

    // Channel Updates
    async logChannelPinsUpdate(channel) {
        if (!channel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(channel.guild, 'channel_log', loggerEmbeds.channelPinsUpdate(this.client, channel));
    }
    async logChannelUpdateName(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newChannel.guild, 'channel_log', loggerEmbeds.channelUpdateName(this.client, oldChannel, newChannel));
    }
    async logChannelUpdateNSFW(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newChannel.guild, 'channel_log', loggerEmbeds.channelUpdateNSFW(this.client, oldChannel, newChannel));
    }
    async logChannelUpdateTopic(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newChannel.guild, 'channel_log', loggerEmbeds.channelUpdateTopic(this.client, oldChannel, newChannel));
    }
    async logChannelUpdateSlowmode(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const loggerEmbeds = require('../utils/loggerEmbeds');
        this.sendLog(newChannel.guild, 'channel_log', loggerEmbeds.channelUpdateSlowmode(this.client, oldChannel, newChannel));
    }

    /**
     * Envoyer l'embed au canal spécifié
     */
    async sendToChannel(guild, channelId, embed) {
        if (!channelId) {
            await this.writeLocalLog(embed);
            return true;
        }

        try {
            const channel = await this.getChannel(guild, channelId);

            if (!channel || !channel.isTextBased()) {
                // Silencieux si le channel n'existe pas, on log juste en local
                await this.writeLocalLog(embed);
                return false;
            }

            // Vérifier les permissions
            const permissions = channel.permissionsFor(guild.members.me);
            if (!permissions.has('ViewChannel') || !permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
                console.warn(`⚠️ Manque de permissions pour logger dans ${channel.name} (${channel.id})`);
                await this.writeLocalLog(embed);
                return false;
            }

            await channel.send({ embeds: [embed] });
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi du log:`, error.message);
            await this.writeLocalLog(embed);
            return false;
        }
    }

    async writeLocalLog(embed) {
        try {
            const data = this.formatEmbed(embed);
            const filePath = path.join(LOGS_DIR, `${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(filePath, data + '\n\n', { encoding: 'utf8' });
            return true;
        } catch (e) {
            console.error('❌ Impossible d\'écrire le log localement:', e.message);
            return false;
        }
    }

    formatEmbed(embed) {
        try {
            // embed peut être un EmbedBuilder -> toJSON() disponible
            const obj = typeof embed.toJSON === 'function' ? embed.toJSON() : (embed || {});
            const title = obj.title || '';
            const timestamp = obj.timestamp || new Date().toISOString();
            const fields = (obj.fields || []).map(f => `${f.name}: ${f.value}`).join('\n');
            const description = obj.description || '';
            return `[${timestamp}] ${title}\n${description}\n${fields}`;
        } catch (e) {
            return `[${new Date().toISOString()}] Log embed (non-serialisable)`;
        }
    }

    /**
     * Configurer les IDs des canaux de log
     */
    setLogChannels(channels) {
        this.logChannelIds = { ...this.logChannelIds, ...channels };
    }

    /**
     * Obtenir les informations de configuration
     */
    getLogChannels() {
        return this.logChannelIds;
    }
}

module.exports = LogService;

const db = require('../database/database');
const loggerEmbeds = require('../utils/loggerEmbeds');

class LoggerService {
    constructor(client) {
        this.client = client;
        this.channelsCache = new Map();
        this.configCache = new Map();
        this.cacheTTL = 5 * 60 * 1000;
    }

    getConfig(guildId) {
        const cacheKey = `config_${guildId}`;
        const cached = this.configCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const config = db.getLoggerChannels(guildId);
        this.configCache.set(cacheKey, { data: config, timestamp: Date.now() });
        return config;
    }

    clearConfigCache(guildId) {
        this.configCache.delete(`config_${guildId}`);
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

            channel.send({ embeds: [embed] }).catch(() => {});
            return true;
        } catch (error) {
            return false;
        }
    }

    async logChannelCreate(channel) {
        if (!channel.guild) return;
        const embed = loggerEmbeds.channelCreate(this.client, channel);
        this.sendLog(channel.guild, 'channel_log', embed);
    }

    async logChannelDelete(channel) {
        if (!channel.guild) return;
        const embed = loggerEmbeds.channelDelete(this.client, channel);
        this.sendLog(channel.guild, 'channel_log', embed);
    }

    async logChannelPinsUpdate(channel) {
        if (!channel.guild) return;
        const embed = loggerEmbeds.channelPinsUpdate(this.client, channel);
        this.sendLog(channel.guild, 'channel_log', embed);
    }

    async logChannelUpdateName(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const embed = loggerEmbeds.channelUpdateName(this.client, oldChannel, newChannel);
        this.sendLog(newChannel.guild, 'channel_log', embed);
    }

    async logChannelUpdateNSFW(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const embed = loggerEmbeds.channelUpdateNSFW(this.client, oldChannel, newChannel);
        this.sendLog(newChannel.guild, 'channel_log', embed);
    }

    async logChannelUpdateTopic(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const embed = loggerEmbeds.channelUpdateTopic(this.client, oldChannel, newChannel);
        this.sendLog(newChannel.guild, 'channel_log', embed);
    }

    async logChannelUpdateSlowmode(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const embed = loggerEmbeds.channelUpdateSlowmode(this.client, oldChannel, newChannel);
        this.sendLog(newChannel.guild, 'channel_log', embed);
    }

    async logEmojiCreate(emoji) {
        if (!emoji.guild) return;
        const embed = loggerEmbeds.emojiCreate(this.client, emoji);
        this.sendLog(emoji.guild, 'emoji_log', embed);
    }

    async logEmojiDelete(emoji) {
        if (!emoji.guild) return;
        const embed = loggerEmbeds.emojiDelete(this.client, emoji);
        this.sendLog(emoji.guild, 'emoji_log', embed);
    }

    async logEmojiUpdate(oldEmoji, newEmoji) {
        if (!newEmoji.guild) return;
        const embed = loggerEmbeds.emojiUpdate(this.client, oldEmoji, newEmoji);
        this.sendLog(newEmoji.guild, 'emoji_log', embed);
    }

    async logBanAdd(ban) {
        if (!ban.guild) return;
        const embed = loggerEmbeds.guildBanAdd(this.client, ban);
        this.sendLog(ban.guild, 'ban_log', embed);
    }

    async logBanRemove(ban) {
        if (!ban.guild) return;
        const embed = loggerEmbeds.guildBanRemove(this.client, ban);
        this.sendLog(ban.guild, 'ban_log', embed);
    }

    async logMemberJoin(member) {
        if (!member.guild) return;
        const embed = loggerEmbeds.guildMemberAdd(this.client, member);
        this.sendLog(member.guild, 'join_log', embed);
    }

    async logMemberLeave(member) {
        if (!member.guild) return;
        const embed = loggerEmbeds.guildMemberRemove(this.client, member);
        this.sendLog(member.guild, 'leave_log', embed);
    }

    async logMessageDelete(message) {
        if (!message.guild) return;
        if (message.author?.bot) return;
        const embed = loggerEmbeds.messageDelete(this.client, message);
        this.sendLog(message.guild, 'message_log', embed);
    }

    async logMessageUpdate(oldMessage, newMessage) {
        if (!newMessage.guild) return;
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const oldEmbed = loggerEmbeds.messageUpdateOld(this.client, oldMessage);
        const newEmbed = loggerEmbeds.messageUpdateNew(this.client, oldMessage, newMessage);
        
        const config = this.getConfig(newMessage.guild.id);
        if (!config || !config.message_log) return;

        try {
            const channel = await this.getChannel(newMessage.guild, config.message_log);
            if (!channel || !channel.isTextBased()) return;

            const permissions = channel.permissionsFor(newMessage.guild.members.me);
            if (!permissions?.has('ViewChannel') || !permissions?.has('SendMessages') || !permissions?.has('EmbedLinks')) {
                return;
            }

            channel.send({ embeds: [oldEmbed, newEmbed] }).catch(() => {});
        } catch (error) {
        }
    }

    async logVoiceJoin(newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceJoin(this.client, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceLeave(oldState) {
        if (!oldState.guild) return;
        const embed = loggerEmbeds.voiceLeave(this.client, oldState);
        this.sendLog(oldState.guild, 'voice_log', embed);
    }

    async logVoiceSwitch(oldState, newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceSwitch(this.client, oldState, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceMute(newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceMute(this.client, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceUnmute(newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceUnmute(this.client, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceDeaf(newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceDeaf(this.client, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceUndeaf(newState) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceUndeaf(this.client, newState);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceServerMute(newState, muted) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceServerMute(this.client, newState, muted);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceServerDeaf(newState, deafened) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceServerDeaf(this.client, newState, deafened);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceStream(newState, streaming) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceStream(this.client, newState, streaming);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    async logVoiceVideo(newState, video) {
        if (!newState.guild) return;
        const embed = loggerEmbeds.voiceVideo(this.client, newState, video);
        this.sendLog(newState.guild, 'voice_log', embed);
    }

    setChannel(guildId, logType, channelId) {
        db.setLoggerChannel(guildId, logType, channelId);
        this.clearConfigCache(guildId);
    }

    removeChannel(guildId, logType) {
        db.removeLoggerChannel(guildId, logType);
        this.clearConfigCache(guildId);
    }

    getChannels(guildId) {
        return this.getConfig(guildId);
    }
}

module.exports = LoggerService;

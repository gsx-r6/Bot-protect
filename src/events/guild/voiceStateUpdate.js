const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    
    async execute(oldState, newState, client) {
        try {
            const statsJob = require('../../jobs/statsVoiceUpdater');
            if (statsJob && statsJob.updateOnce && oldState.channelId !== newState.channelId) {
                await statsJob.updateOnce(client, newState.guild);
            }

            if (client.logs && oldState.channelId !== newState.channelId) {
                if (!oldState.channelId && newState.channelId) {
                    client.logs.logVoice(newState.guild, 'JOIN', { user: newState.member.user, channel: newState.channel }).catch(() => {});
                } else if (oldState.channelId && !newState.channelId) {
                    client.logs.logVoice(newState.guild, 'LEAVE', { user: oldState.member.user, channel: oldState.channel }).catch(() => {});
                } else {
                    client.logs.logVoice(newState.guild, 'MOVE', { user: newState.member.user, channel: newState.channel }).catch(() => {});
                }
            }

            if (client.loggerService) {
                if (!oldState.channelId && newState.channelId) {
                    client.loggerService.logVoiceJoin(newState);
                } else if (oldState.channelId && !newState.channelId) {
                    client.loggerService.logVoiceLeave(oldState);
                } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                    client.loggerService.logVoiceSwitch(oldState, newState);
                }

                if (oldState.selfMute !== newState.selfMute) {
                    if (newState.selfMute) {
                        client.loggerService.logVoiceMute(newState);
                    } else {
                        client.loggerService.logVoiceUnmute(newState);
                    }
                }

                if (oldState.selfDeaf !== newState.selfDeaf) {
                    if (newState.selfDeaf) {
                        client.loggerService.logVoiceDeaf(newState);
                    } else {
                        client.loggerService.logVoiceUndeaf(newState);
                    }
                }

                if (oldState.serverMute !== newState.serverMute) {
                    client.loggerService.logVoiceServerMute(newState, newState.serverMute);
                }

                if (oldState.serverDeaf !== newState.serverDeaf) {
                    client.loggerService.logVoiceServerDeaf(newState, newState.serverDeaf);
                }

                if (oldState.streaming !== newState.streaming) {
                    client.loggerService.logVoiceStream(newState, newState.streaming);
                }

                if (oldState.selfVideo !== newState.selfVideo) {
                    client.loggerService.logVoiceVideo(newState, newState.selfVideo);
                }
            }
        } catch (error) {
            logger.error('[VoiceStateUpdate] Erreur:', error);
        }
    }
};

const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,

    async execute(oldState, newState, client) {
        try {
            if (client.logs) {
                if (!oldState.channelId && newState.channelId) {
                    client.logs.logVoiceJoin(newState);
                } else if (oldState.channelId && !newState.channelId) {
                    client.logs.logVoiceLeave(oldState);
                } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                    client.logs.logVoiceSwitch(oldState, newState);
                }

                if (oldState.selfMute !== newState.selfMute) {
                    if (newState.selfMute) {
                        client.logs.logVoiceMute(newState);
                    } else {
                        client.logs.logVoiceUnmute(newState);
                    }
                }

                if (oldState.selfDeaf !== newState.selfDeaf) {
                    if (newState.selfDeaf) {
                        client.logs.logVoiceDeaf(newState);
                    } else {
                        client.logs.logVoiceUndeaf(newState);
                    }
                }

                if (oldState.serverMute !== newState.serverMute) {
                    client.logs.logVoiceServerMute(newState, newState.serverMute);
                }

                if (oldState.serverDeaf !== newState.serverDeaf) {
                    client.logs.logVoiceServerDeaf(newState, newState.serverDeaf);
                }

                if (oldState.streaming !== newState.streaming) {
                    client.logs.logVoiceStream(newState, newState.streaming);
                }

                if (oldState.selfVideo !== newState.selfVideo) {
                    client.logs.logVoiceVideo(newState, newState.selfVideo);
                }
            }

            if (oldState.channelId !== newState.channelId) {
                try {
                    const statsJob = require('../../jobs/statsVoiceUpdater');
                    if (statsJob && statsJob.updateOnce) {
                        statsJob.updateOnce(client, newState.guild).catch(() => { });
                    }
                } catch (e) { }
            }
        } catch (error) {
            logger.error('[VoiceStateUpdate] Erreur:', error);
        }
    }
};

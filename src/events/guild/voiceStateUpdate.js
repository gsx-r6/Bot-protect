const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    
    async execute(oldState, newState, client) {
        try {
            if (oldState.channelId !== newState.channelId) {
                const statsJob = require('../../jobs/statsVoiceUpdater');
                if (statsJob && statsJob.updateOnce) {
                    await statsJob.updateOnce(client, newState.guild);
                }

                // Détecter join / leave
                try {
                    if (client.logs) {
                        if (!oldState.channelId && newState.channelId) {
                            // joined
                            await client.logs.logVoice(newState.guild, 'JOIN', { user: newState.member.user, channel: newState.channel });
                        } else if (oldState.channelId && !newState.channelId) {
                            // left
                            await client.logs.logVoice(newState.guild, 'LEAVE', { user: oldState.member.user, channel: oldState.channel });
                        } else {
                            // moved
                            await client.logs.logVoice(newState.guild, 'MOVE', { user: newState.member.user, channel: newState.channel, extras: { from: oldState.channelId, to: newState.channelId } });
                        }
                    }
                } catch (e) {
                    logger.error('[VoiceStateUpdate] Error sending voice log:', e);
                }
            }
        } catch (error) {
            logger.error('[VoiceStateUpdate] Erreur:', error);
        }
    }
};

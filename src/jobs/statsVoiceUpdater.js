const logger = require('../utils/logger');

/**
 * Periodically updates configured voice channel names to reflect server stats.
 * Supports 3 separate channels: Members, Online, and Voice
 */

async function updateOnce(client, guild = null) {
    try {
        const cfg = client.config || {};
        const membersChanId = cfg.STATS_CHANNEL_MEMBERS;
        const onlineChanId = cfg.STATS_CHANNEL_ONLINE;
        const voiceChanId = cfg.STATS_CHANNEL_VOICE;

        const ids = [membersChanId, onlineChanId, voiceChanId].filter(Boolean);
        
        for (const id of ids) {
            const channel = await client.channels.fetch(id).catch(() => null);
            if (!channel) {
                logger.warn(`Stats channel ${id} not found in cache or API.`);
                continue;
            }

            const targetGuild = guild || channel.guild;
            if (!targetGuild) {
                logger.warn(`Stats channel ${id} is not attached to a guild.`);
                continue;
            }

            let totalMembers = targetGuild.memberCount || 0;
            let onlineCount = 0;
            let voiceCount = 0;
            
            try {
                await targetGuild.members.fetch();
                onlineCount = targetGuild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size || 0;
                voiceCount = targetGuild.members.cache.filter(m => m.voice && m.voice.channel).size || 0;
            } catch (e) {
                onlineCount = targetGuild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size || 0;
                voiceCount = targetGuild.channels.cache
                    .filter(c => c.isVoiceBased() && c.members)
                    .reduce((acc, ch) => acc + (ch.members?.size || 0), 0) || 0;
            }
            
            totalMembers = isNaN(totalMembers) ? 0 : totalMembers;
            onlineCount = isNaN(onlineCount) ? 0 : onlineCount;
            voiceCount = isNaN(voiceCount) ? 0 : voiceCount;

            let newName = '';
            
            if (id === membersChanId) {
                newName = `🍢 ・Membres : ${totalMembers || 0}`;
            } else if (id === onlineChanId) {
                newName = `🍜 ・En ligne : ${onlineCount || 0}`;
            } else if (id === voiceChanId) {
                newName = `🥢 ・En vocal : ${voiceCount || 0}`;
            }

            if (newName && channel.name !== newName) {
                if (!channel.manageable) {
                    logger.warn(`Cannot rename channel ${id} (no MANAGE_CHANNELS permission).`);
                } else {
                    await channel.setName(newName, '{+} Nami - Mise à jour des stats');
                    logger.debug(`📊 Stats updated: ${newName}`);
                }
            }
        }
    } catch (err) {
        logger.error('Error while updating stats channels: ' + (err.stack || err.message));
    }
}

module.exports = {
    updateOnce,
    
    start: async (client) => {
        try {
            const cfg = client.config || {};
            const membersChanId = cfg.STATS_CHANNEL_MEMBERS;
            const onlineChanId = cfg.STATS_CHANNEL_ONLINE;
            const voiceChanId = cfg.STATS_CHANNEL_VOICE;
            const intervalSec = cfg.STATS_UPDATE_INTERVAL || 300;

            if (!membersChanId && !onlineChanId && !voiceChanId) {
                logger.info('📊 Aucun canal de stats configuré (fonctionnalité désactivée)');
                logger.info('💡 Ajoutez STATS_CHANNEL_MEMBERS, STATS_CHANNEL_ONLINE, STATS_CHANNEL_VOICE dans les Secrets');
                return;
            }

            await updateOnce(client);
            setInterval(() => updateOnce(client), intervalSec * 1000);
            logger.success(`📊 Stats Updater démarré (mise à jour toutes les ${intervalSec / 60} min)`);
            
        } catch (err) {
            logger.error('Failed to start statsVoiceUpdater: ' + (err.stack || err.message));
        }
    }
};

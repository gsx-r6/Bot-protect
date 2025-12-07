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

        logger.debug(`[Stats] Channel IDs - Members: ${membersChanId || 'non configuré'}, Online: ${onlineChanId || 'non configuré'}, Voice: ${voiceChanId || 'non configuré'}`);

        // Fetch any channel to get the guild
        let targetGuild = guild;
        const anyChannelId = membersChanId || onlineChanId || voiceChanId;
        if (!targetGuild && anyChannelId) {
            const anyChannel = await client.channels.fetch(anyChannelId).catch(() => null);
            if (anyChannel) targetGuild = anyChannel.guild;
        }

        if (!targetGuild) {
            logger.warn('[Stats] No guild found for stats update');
            return;
        }

        // Fetch members ONCE for all stats (optimization)
        let totalMembers = targetGuild.memberCount || 0;
        let onlineCount = 0;
        let voiceCount = 0;

        try {
            await targetGuild.members.fetch({ time: 10000, withPresences: true }).catch(() => { });
            onlineCount = targetGuild.members.cache.filter(m =>
                m.presence && m.presence.status !== 'offline'
            ).size || 0;

            voiceCount = targetGuild.channels.cache
                .filter(c => c.isVoiceBased())
                .reduce((acc, ch) => acc + (ch.members.size || 0), 0);
        } catch (e) {
            logger.warn(`[Stats] Erreur calcul stats: ${e.message}`);
            onlineCount = targetGuild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size || 0;
        }

        logger.debug(`[Stats] Values - Members: ${totalMembers}, Online: ${onlineCount}, Voice: ${voiceCount}`);

        // Update each channel
        const updates = [
            { id: membersChanId, newName: `🍢 ・Membres : ${totalMembers}` },
            { id: onlineChanId, newName: `🍜 ・En ligne : ${onlineCount}` },
            { id: voiceChanId, newName: `🥢 ・En vocal : ${voiceCount}` }
        ];

        for (const { id, newName } of updates) {
            if (!id) {
                logger.debug(`[Stats] Skipping empty channel ID for: ${newName}`);
                continue;
            }

            logger.debug(`[Stats] Processing channel ${id} for: ${newName}`);

            try {
                const channel = await client.channels.fetch(id).catch((e) => {
                    logger.warn(`[Stats] Fetch error for ${id}: ${e.message}`);
                    return null;
                });
                if (!channel) {
                    logger.warn(`[Stats] Channel ${id} not found`);
                    continue;
                }

                logger.debug(`[Stats] Channel ${id} current name: "${channel.name}", new name: "${newName}"`);

                if (channel.name !== newName) {
                    if (!channel.manageable) {
                        logger.warn(`[Stats] Cannot rename channel ${id} (no permission)`);
                    } else {
                        await channel.setName(newName, '{+} uhq Monde - Mise à jour des stats').catch(e => {
                            if (e.code === 50013) {
                                logger.warn(`[Stats] Missing permissions for channel ${id}`);
                            } else if (e.code === 429) {
                                logger.warn(`[Stats] Rate limit for channel ${id}`);
                            } else {
                                logger.error(`[Stats] Failed to update channel ${id}: ${e.message}`);
                            }
                        });
                        logger.debug(`📊 Stats updated: ${newName}`);
                    }
                } else {
                    logger.debug(`📊 Stats unchanged: ${newName}`);
                }
            } catch (err) {
                logger.error(`[Stats] Error updating channel ${id}: ${err.message}`);
            }
        }
    } catch (err) {
        logger.error('[Stats] Error while updating stats channels: ' + (err.stack || err.message));
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
            const intervalSec = cfg.STATS_UPDATE_INTERVAL || 600; // 10 minutes par défaut pour éviter rate limits

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

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

        // Si aucun channel n'est configuré, on arrête là
        if (ids.length === 0) return;

        // Pour éviter de spammer l'API si on a plusieurs channels sur le même serveur,
        // on regroupe par guilde si possible. Mais ici on itère par channel ID.

        for (const id of ids) {
            const channel = await client.channels.fetch(id).catch(() => null);
            if (!channel) {
                // logger.warn(`Stats channel ${id} not found in cache or API.`);
                continue;
            }

            const targetGuild = guild || channel.guild;
            if (!targetGuild) {
                continue;
            }

            // Récupération des stats
            let totalMembers = targetGuild.memberCount || 0;
            let onlineCount = 0;
            let voiceCount = 0;

            try {
                // IMPORTANT: Il faut fetch avec presences pour avoir le statut en ligne correct
                // Cela peut être lourd sur les gros serveurs, donc on met un timeout
                await targetGuild.members.fetch({ time: 10000, withPresences: true }).catch(() => { });

                onlineCount = targetGuild.members.cache.filter(m =>
                    m.presence && m.presence.status !== 'offline'
                ).size || 0;

                // Pour le vocal, on regarde les channels vocaux directement, c'est plus fiable
                voiceCount = targetGuild.channels.cache
                    .filter(c => c.isVoiceBased())
                    .reduce((acc, ch) => acc + (ch.members.size || 0), 0);

            } catch (e) {
                logger.warn(`Erreur calcul stats pour guilde ${targetGuild.name}: ${e.message}`);
                // Fallback sur le cache existant
                onlineCount = targetGuild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size || 0;
            }

            // Formatage
            let newName = '';
            if (id === membersChanId) {
                newName = `🍢 ・Membres : ${totalMembers}`;
            } else if (id === onlineChanId) {
                newName = `🍜 ・En ligne : ${onlineCount}`;
            } else if (id === voiceChanId) {
                newName = `🥢 ・En vocal : ${voiceCount}`;
            }

            // Mise à jour si nécessaire
            if (newName && channel.name !== newName) {
                if (!channel.manageable) {
                    logger.warn(`Cannot rename channel ${id} (no MANAGE_CHANNELS permission).`);
                } else {
                    // Rate limit protection: Discord permet 2 updates / 10 min
                    await channel.setName(newName, '{+} uhq Monde - Mise à jour des stats').catch(e => {
                        if (e.code === 50013) { // Missing Permissions
                            logger.warn(`Missing permissions to update channel ${id}`);
                        } else if (e.code === 429) { // Rate Limit
                            logger.warn(`Rate limit hit for channel ${id}, skipping update.`);
                        } else {
                            logger.error(`Failed to update channel ${id}: ${e.message}`);
                        }
                    });
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

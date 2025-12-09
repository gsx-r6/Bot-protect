module.exports = {
    PREFIX: process.env.PREFIX || '+',
    OWNER_ID: process.env.OWNER_ID || null,
    EMBED_COLOR: process.env.EMBED_COLOR || '#FF69B4',

    // 📊 Stats channels (IDs) - Configure via environment variables
    STATS_CHANNEL_MEMBERS: process.env.STATS_CHANNEL_MEMBERS || '',
    STATS_CHANNEL_ONLINE: process.env.STATS_CHANNEL_ONLINE || '',
    STATS_CHANNEL_VOICE: process.env.STATS_CHANNEL_VOICE || '',
    STATS_UPDATE_INTERVAL: parseInt(process.env.STATS_UPDATE_INTERVAL || '300', 10), // 5 minutes par défaut

    // 📝 LOG CHANNELS - Configure via environment variables
    // Chaque type d'action sera loggé dans son canal dédié
    LOG_CHANNELS: {
        MODERATION: process.env.LOG_CHANNEL_MODERATION || '', // Ban, kick, mute, warn, timeout
        MEMBER: process.env.LOG_CHANNEL_MEMBER || '', // Join/leave serveur
        MESSAGE: process.env.LOG_CHANNEL_MESSAGE || '', // Delete/edit messages
        VOICE: process.env.LOG_CHANNEL_VOICE || '', // Join/leave vocal
        GUILD: process.env.LOG_CHANNEL_GUILD || '', // Config serveur changée
        SECURITY: process.env.LOG_CHANNEL_SECURITY || '', // Alerte sécurité, détections
        ROLES: process.env.LOG_CHANNEL_ROLES || '', // Assignation/retrait de rôles
        CHANNELS: process.env.LOG_CHANNEL_CHANNELS || '' // Create/delete/edit canaux
    },
    // Validation basique
    validate() {
        if (!process.env.TOKEN) {
            console.error('❌ ERREUR CRITIQUE: TOKEN manquant dans le fichier .env');
            process.exit(1);
        }
    }
};

// Auto-validation à l'import
if (process.env.NODE_ENV !== 'test') {
    if (!process.env.TOKEN) {
        console.warn('⚠️ ATTENTION: TOKEN manquant. Le bot ne pourra pas démarrer.');
    }
}

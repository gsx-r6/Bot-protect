const { Events } = require('discord.js');

module.exports = {
    name: Events.PresenceUpdate,
    once: false,
    
    async execute(oldPresence, newPresence, client) {
        try {
            if (oldPresence?.status !== newPresence?.status) {
                const guild = newPresence?.guild ?? oldPresence?.guild;
                if (!guild) return;
                
                const statsJob = require('../../jobs/statsVoiceUpdater');
                if (statsJob && statsJob.updateOnce) {
                    await statsJob.updateOnce(client, guild);
                }
            }
        } catch (error) {
            // Erreur silencieuse (presenceUpdate est très fréquent)
        }
    }
};

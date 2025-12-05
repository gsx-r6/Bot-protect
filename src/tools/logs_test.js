/*
 * Script de test simulé pour LogService
 * Ne démarre pas le bot. Permet de simuler l'envoi d'un embed vers LogService.
 * Usage: (non exécuté automatiquement) `node src/tools/logs_test.js` si vous voulez tester localement
 */

const LogService = require('../services/LogService');
const { EmbedBuilder, ChannelType } = require('discord.js');

// Simuler un "guild" minimal avec channels.fetch retournant un canal factice
const fakeGuild = {
    id: 'GUILD_FAKE',
    channels: {
        async fetch(id) {
            // Simuler canal non-configuré => retourne un canal factice
            return {
                id,
                name: 'test-log',
                type: ChannelType.GuildText,
                async send(payload) {
                    console.log('Simulated send to channel:', id);
                    console.log(JSON.stringify(payload.embeds ? payload.embeds.map(e => e.toJSON()) : payload, null, 2));
                    return true;
                }
            };
        }
    }
};

(async () => {
    const fakeClient = { config: {}, user: { tag: 'Fake#0001' } };
    const svc = new LogService(fakeClient);

    // Forcer un logChannels vide pour tester fallback local
    svc.setLogChannels({ MODERATION: '', MEMBER: '', MESSAGE: '', VOICE: '', GUILD: '', SECURITY: '', ROLES: '', CHANNELS: '' });

    const embed = new EmbedBuilder()
        .setTitle('🛡️ TEST LOG')
        .setDescription('Test du LogService (fallback local)')
        .addFields({ name: 'Test', value: 'Ceci est une entrée de test' })
        .setTimestamp();

    console.log('--- Simulating local fallback write ---');
    await svc.writeLocalLog(embed);
    console.log('Wrote to data/logs/*.log');

    // Simuler envoi vers un channel (force un id)
    svc.setLogChannels({ MODERATION: 'FAKE_CHANNEL' });
    console.log('--- Simulating channel send ---');
    await svc.sendToChannel(fakeGuild, 'FAKE_CHANNEL', embed);

    console.log('Test script finished (no bot started).');
})();

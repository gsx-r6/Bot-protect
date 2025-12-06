const { Events } = require('discord.js');
const logger = require('../../utils/logger');

// Cache des messages récents par utilisateur
const messageCache = new Map();

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            const userId = message.author.id;
            const content = message.content.toLowerCase().trim();

            if (content.length < 3) return; // Ignorer messages très courts

            // Récupérer l'historique de l'utilisateur
            if (!messageCache.has(userId)) {
                messageCache.set(userId, []);
            }

            const userMessages = messageCache.get(userId);
            const now = Date.now();

            // Nettoyer les messages de plus de 10 secondes
            const recentMessages = userMessages.filter(msg => now - msg.timestamp < 10000);

            // Vérifier si le message est identique à un récent
            const isDuplicate = recentMessages.some(msg => msg.content === content);

            if (isDuplicate) {
                await message.delete().catch(() => { });

                const warning = await message.channel.send({
                    content: `${message.author}, ⚠️ Pas de messages répétés !`
                });

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                logger.info(`[AntiRepeat] Message répété supprimé de ${message.author.tag}`);

                // Log dans le salon automod
                if (client.loggerService) {
                    try {
                        await client.loggerService.logAutomod(message.guild, 'REPEAT', {
                            user: message.author,
                            content: message.content
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            } else {
                // Ajouter le message au cache
                recentMessages.push({ content, timestamp: now });
                messageCache.set(userId, recentMessages);
            }

            // Nettoyer le cache périodiquement
            if (Math.random() < 0.01) { // 1% de chance
                for (const [uid, msgs] of messageCache.entries()) {
                    const filtered = msgs.filter(msg => now - msg.timestamp < 10000);
                    if (filtered.length === 0) {
                        messageCache.delete(uid);
                    } else {
                        messageCache.set(uid, filtered);
                    }
                }
            }
        } catch (err) {
            logger.error('[AntiRepeat] Erreur:', err);
        }
    }
};

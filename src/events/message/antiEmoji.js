const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            // Compter les emojis (Unicode + custom)
            const emojiRegex = /<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
            const emojis = message.content.match(emojiRegex) || [];

            // Si >5 emojis
            if (emojis.length > 5) {
                await message.delete().catch(() => { });

                const warning = await message.channel.send({
                    content: `${message.author}, ⚠️ Pas de spam d'emojis ! (${emojis.length} emojis détectés)`
                });

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                logger.info(`[AntiEmoji] Message supprimé de ${message.author.tag}: ${emojis.length} emojis`);

                // Log dans le salon automod
                if (client.loggerService) {
                    try {
                        await client.loggerService.logAutomod(message.guild, 'EMOJI_SPAM', {
                            user: message.author,
                            content: message.content,
                            emojiCount: emojis.length
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        } catch (err) {
            logger.error('[AntiEmoji] Erreur:', err);
        }
    }
};

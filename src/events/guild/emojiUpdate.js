const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildEmojiUpdate,
    once: false,

    async execute(oldEmoji, newEmoji, client) {
        try {
            if (!newEmoji.guild) return;

            if (oldEmoji.name !== newEmoji.name) {
                logger.info(`✏️ Emoji modifié: ${oldEmoji.name} -> ${newEmoji.name} dans ${newEmoji.guild.name}`);

                if (client.logs) {
                    client.logs.logEmojiUpdate(oldEmoji, newEmoji);
                }
            }
        } catch (error) {
            logger.error('[EmojiUpdate] Erreur:', error);
        }
    }
};

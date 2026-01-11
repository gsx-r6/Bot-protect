const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildEmojiDelete,
    once: false,

    async execute(emoji, client) {
        try {
            if (!emoji.guild) return;
            logger.info(`😢 Emoji supprimé: ${emoji.name} dans ${emoji.guild.name}`);

            if (client.logs) {
                client.logs.logEmojiDelete(emoji);
            }
        } catch (error) {
            logger.error('[EmojiDelete] Erreur:', error);
        }
    }
};

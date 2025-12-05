const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.GuildEmojiCreate,
    once: false,
    
    async execute(emoji, client) {
        try {
            if (!emoji.guild) return;
            logger.info(`😀 Emoji créé: ${emoji.name} dans ${emoji.guild.name}`);
            
            if (client.loggerService) {
                client.loggerService.logEmojiCreate(emoji);
            }
        } catch (error) {
            logger.error('[EmojiCreate] Erreur:', error);
        }
    }
};

const { Events } = require('discord.js');
const CacheService = require('../../services/CacheService');
const logger = require('../../utils/logger');

// LogService via client.logs

module.exports = {
    name: Events.MessageDelete,
    once: false,
    
    async execute(message, client) {
        try {
            if (message.author?.bot) return;
            if (!message.content && message.attachments.size === 0) return;
            
            CacheService.cacheDeletedMessage(message);
            logger.debug(`📝 Message deleted cached from ${message.author?.tag} in ${message.channel.id}`);

            // Envoyer le log de manière non-bloquante
            if (client.logs) {
                client.logs.logMessage(message.guild, 'DELETE', {
                    author: message.author,
                    channel: message.channel,
                    messageId: message.id,
                    content: message.content
                }).catch(e => logger.error('[MessageDelete] Error sending log:', e));
            }
        } catch (error) {
            logger.error('[MessageDelete] Error:', error);
        }
    }
};

const { Events } = require('discord.js');
const CacheService = require('../../services/CacheService');
const logger = require('../../utils/logger');

// LogService via client.logs

module.exports = {
    name: Events.MessageUpdate,
    once: false,
    
    async execute(oldMessage, newMessage, client) {
        try {
            if (newMessage.author?.bot) return;
            
            const oldContent = oldMessage.content || '';
            const oldAttachments = Array.from(oldMessage.attachments.values());
            const oldAuthor = oldMessage.author;
            
            if (oldMessage.partial) {
                try {
                    newMessage = await newMessage.fetch();
                } catch (err) {
                    logger.debug('Could not fetch new message for partial old message');
                    return;
                }
            }
            
            const newContent = newMessage.content || '';
            const newAttachments = Array.from(newMessage.attachments.values());
            
            const oldAttachmentIds = oldAttachments.map(a => a.id).sort().join(',');
            const newAttachmentIds = newAttachments.map(a => a.id).sort().join(',');
            
            if (oldContent === newContent && oldAttachmentIds === newAttachmentIds) return;
            
            const oldMessageSnapshot = {
                content: oldContent,
                attachments: new Map(oldAttachments.map(a => [a.id, a])),
                author: oldAuthor
            };
            
            CacheService.cacheEditedMessage(oldMessageSnapshot, newMessage);
            logger.debug(`✏️ Message edit cached from ${newMessage.author?.tag} in ${newMessage.channel.id}`);

            // Envoyer le log au canal approprié si configuré
            try {
                if (client.logs) {
                    await client.logs.logMessage(newMessage.guild, 'EDIT', {
                        author: newMessage.author,
                        channel: newMessage.channel,
                        messageId: newMessage.id,
                        before: oldContent,
                        after: newContent
                    });
                }
            } catch (e) {
                logger.error('[MessageUpdate] Error sending log:', e);
            }
        } catch (error) {
            logger.error('[MessageUpdate] Error:', error);
        }
    }
};

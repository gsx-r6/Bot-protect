const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageDelete,
    once: false,
    async execute(message, client) {
        try {
            if (!message.guild || message.author?.bot) return;

            if (!client.snipes) {
                client.snipes = new Map();
            }

            client.snipes.set(message.channel.id, {
                content: message.content,
                author: message.author,
                image: message.attachments.first() ? message.attachments.first().proxyURL : null,
                date: new Date()
            });

            if (client.logs && message.author) {
                client.logs.logMessage(message.guild, 'DELETE', {
                    author: message.author,
                    channel: message.channel,
                    messageId: message.id,
                    content: message.content
                }).catch(() => {});
            }

            if (client.loggerService) {
                client.loggerService.logMessageDelete(message);
            }
        } catch (error) {
            logger.error('[MessageDelete] Error:', error);
        }
    }
};

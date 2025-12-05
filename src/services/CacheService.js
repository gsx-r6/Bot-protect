class CacheService {
    constructor() {
        this.deletedMessages = new Map();
        this.editedMessages = new Map();
        this.maxCacheSize = 100;
        this.cacheExpiry = 300000;
    }

    cacheDeletedMessage(message) {
        const key = message.channel.id;
        const attachments = Array.from(message.attachments.values()).map(a => ({
            id: a.id,
            name: a.name,
            size: a.size,
            url: a.url,
            proxyURL: a.proxyURL,
            contentType: a.contentType
        }));

        this.deletedMessages.set(key, {
            content: message.content,
            author: {
                id: message.author.id,
                tag: message.author.tag,
                username: message.author.username,
                discriminator: message.author.discriminator,
                avatarURL: message.author.displayAvatarURL()
            },
            createdAt: message.createdAt,
            attachments: attachments,
            timestamp: Date.now()
        });

        if (this.deletedMessages.size > this.maxCacheSize) {
            const firstKey = this.deletedMessages.keys().next().value;
            this.deletedMessages.delete(firstKey);
        }

        setTimeout(() => {
            const cached = this.deletedMessages.get(key);
            if (cached && Date.now() - cached.timestamp >= this.cacheExpiry) {
                this.deletedMessages.delete(key);
            }
        }, this.cacheExpiry);
    }

    cacheEditedMessage(oldMessage, newMessage) {
        const key = newMessage.channel.id;
        
        const oldAttachments = Array.from(oldMessage.attachments.values()).map(a => ({
            id: a.id,
            name: a.name,
            size: a.size,
            url: a.url,
            proxyURL: a.proxyURL,
            contentType: a.contentType
        }));

        const newAttachments = Array.from(newMessage.attachments.values()).map(a => ({
            id: a.id,
            name: a.name,
            size: a.size,
            url: a.url,
            proxyURL: a.proxyURL,
            contentType: a.contentType
        }));

        this.editedMessages.set(key, {
            oldContent: oldMessage.content,
            newContent: newMessage.content,
            oldAttachments: oldAttachments,
            newAttachments: newAttachments,
            author: {
                id: newMessage.author.id,
                tag: newMessage.author.tag,
                username: newMessage.author.username,
                discriminator: newMessage.author.discriminator,
                avatarURL: newMessage.author.displayAvatarURL()
            },
            editedAt: new Date(),
            timestamp: Date.now()
        });

        if (this.editedMessages.size > this.maxCacheSize) {
            const firstKey = this.editedMessages.keys().next().value;
            this.editedMessages.delete(firstKey);
        }

        setTimeout(() => {
            const cached = this.editedMessages.get(key);
            if (cached && Date.now() - cached.timestamp >= this.cacheExpiry) {
                this.editedMessages.delete(key);
            }
        }, this.cacheExpiry);
    }

    getDeletedMessage(channelId) {
        return this.deletedMessages.get(channelId);
    }

    getEditedMessage(channelId) {
        return this.editedMessages.get(channelId);
    }

    clearChannel(channelId) {
        this.deletedMessages.delete(channelId);
        this.editedMessages.delete(channelId);
    }
}

module.exports = new CacheService();

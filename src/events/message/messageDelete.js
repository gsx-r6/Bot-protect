const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    once: false,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        // Initialiser la collection de snipes si elle n'existe pas
        if (!client.snipes) {
            client.snipes = new Map();
        }

        // Sauvegarder les infos du message supprimé
        client.snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            image: message.attachments.first() ? message.attachments.first().proxyURL : null,
            date: new Date()
        });
    }
};

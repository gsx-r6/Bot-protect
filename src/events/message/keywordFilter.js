const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        if (hasInsulte || hasArgent) {
            try {
                const embed = new EmbedBuilder()
                    .setColor(hasInsulte ? '#FF0000' : '#FFA500')
                    .setTitle(`${hasInsulte ? '⚠️ INSULTE DÉTECTÉE' : '💰 MENTION D\'ARGENT DÉTECTÉE'}`)
                    .setDescription(`Message de ${message.author} dans ${message.channel}`)
                    .addFields(
                        { name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: '#️⃣ Salon', value: `<#${message.channel.id}>`, inline: true },
                        { name: '📝 Contenu', value: message.content.substring(0, 1024) || 'Aucun contenu texte' },
                        { name: '🔗 Lien', value: `[Aller au message](${message.url})` }
                    )
                    .setTimestamp();

                if (client.logs) {
                    await client.logs.logAutomod(message.guild, 'automod_log', embed);
                }
            } catch (err) {
                logger.error('Error sending automod alert: ' + err.message);
            }
        }
    }
};

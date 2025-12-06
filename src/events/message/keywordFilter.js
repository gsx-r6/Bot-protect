const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        if (!client.loggerService) return;

        const config = client.loggerService.getConfig(message.guild.id);
        const automodChannelId = config?.automod_log;
        
        if (!automodChannelId) {
            return;
        }

        const insultePatterns = [
            /\b(pd|pute|salope|connard|batard|fdp|enculé|enculer|ntm|tg|ferme ta gueule|ta gueule)\b/i
        ];

        const argentPatterns = [
            /\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$|£|livre)?\s*(paypal|virement|venmo|cashapp|transfert)\b/i,
            /\b(paypal|virement|cb|carte bancaire|iban|venmo|cashapp)\s+.*\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\b/i,
            /\b(vendre?|vends|acheter?|achète)\s+.*\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\b/i,
            /\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\s+(via|par|avec|sur|en)\s*(paypal|virement|venmo)\b/i
        ];

        let hasInsulte = false;
        let hasArgent = false;

        for (const pattern of insultePatterns) {
            if (pattern.test(message.content)) {
                hasInsulte = true;
                break;
            }
        }

        for (const pattern of argentPatterns) {
            if (pattern.test(message.content)) {
                hasArgent = true;
                break;
            }
        }

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

                await client.loggerService.sendLog(message.guild, 'automod_log', embed);
            } catch (err) {
                logger.error('Error sending automod alert: ' + err.message);
            }
        }
    }
};

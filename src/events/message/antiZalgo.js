const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            const content = message.content;

            // Détecter caractères zalgo/unicode suspects
            // Zalgo = caractères combinés excessifs (diacritiques)
            const zalgoRegex = /[\u0300-\u036f\u0489]{3,}/g;
            const hasZalgo = zalgoRegex.test(content);

            // Détecter caractères unicode suspects (invisible, RTL, etc.)
            const suspiciousUnicode = /[\u200B-\u200D\u2060-\u2069\u202A-\u202E]/g;
            const hasSuspicious = suspiciousUnicode.test(content);

            if (hasZalgo || hasSuspicious) {
                await message.delete().catch(() => { });

                const warning = await message.channel.send({
                    content: `${message.author}, ⚠️ Caractères suspects détectés ! Message supprimé.`
                });

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                logger.info(`[AntiZalgo] Message suspect supprimé de ${message.author.tag}`);

                // Log dans le salon automod
                if (client.logs) {
                    try {
                        await client.logs.logSecurity(message.guild, 'ZALGO_DETECTE', {
                            user: message.author,
                            severity: 'MOYENNE',
                            description: `Caractères suspects détectés dans ${message.channel}`,
                            extras: {
                                Type: hasZalgo ? 'Zalgo' : 'Unicode suspect',
                                Contenu: message.content
                            }
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        } catch (err) {
            logger.error('[AntiZalgo] Erreur:', err);
        }
    }
};

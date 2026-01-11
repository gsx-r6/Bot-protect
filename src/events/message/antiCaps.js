const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            const content = message.content;

            // Compter les majuscules
            const letters = content.replace(/[^a-zA-Z]/g, '');
            if (letters.length < 5) return; // Ignorer messages trop courts

            const uppercase = content.replace(/[^A-Z]/g, '');
            const percentage = (uppercase.length / letters.length) * 100;

            // Si >70% de majuscules
            if (percentage > 80) {
                await message.delete().catch(() => { });

                const warning = await message.channel.send({
                    content: `${message.author}, ⚠️ Pas de CAPS LOCK excessif ! (${Math.round(percentage)}% majuscules)`
                });

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                logger.info(`[AntiCaps] Message supprimé de ${message.author.tag}: ${percentage.toFixed(1)}% CAPS`);

                // Log dans le salon automod si configuré
                if (client.logs) {
                    try {
                        await client.logs.logSecurity(message.guild, 'CAPS_LOCK_EXCESSIF', {
                            user: message.author,
                            severity: 'BASSE',
                            description: `Caps Lock excessif détecté dans ${message.channel}`,
                            extras: {
                                Pourcentage: `${Math.round(percentage)}%`,
                                Contenu: message.content
                            }
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        } catch (err) {
            logger.error('[AntiCaps] Erreur:', err);
        }
    }
};

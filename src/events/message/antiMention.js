const { Events } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            // Compter les mentions (@user et @role)
            const mentions = message.mentions.users.size + message.mentions.roles.size;

            // Si >3 mentions
            if (mentions > 3) {
                await message.delete().catch(() => { });

                // Mute temporaire (30 secondes)
                try {
                    await message.member.timeout(30 * 1000, 'Spam de mentions');
                } catch (e) {
                    // Ignore si pas de permissions
                }

                const warning = await message.channel.send({
                    content: `${message.author}, ⚠️ Pas de spam de mentions ! Mute 30 secondes. (${mentions} mentions)`
                });

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                logger.info(`[AntiMention] Message supprimé de ${message.author.tag}: ${mentions} mentions`);

                // Log dans le salon automod
                if (client.loggerService) {
                    try {
                        await client.loggerService.logAutomod(message.guild, 'MENTION_SPAM', {
                            user: message.author,
                            content: message.content,
                            mentionCount: mentions,
                            action: 'Mute 30s'
                        });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        } catch (err) {
            logger.error('[AntiMention] Erreur:', err);
        }
    }
};

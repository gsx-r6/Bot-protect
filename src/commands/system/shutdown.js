const embeds = require('../../utils/embeds');

module.exports = {
    name: 'shutdown',
    description: 'Arrêter le bot (OWNER ONLY)',
    category: 'system',
    async execute(message, args, client) {
        try {
            if (message.author.id !== process.env.OWNER_ID) return message.reply({ embeds: [embeds.error('Owner only')] });
            await message.reply({ embeds: [embeds.info('Arrêt du bot en cours...')] });
            client.logger.info('Shutdown initiated by owner.');
            await client.destroy();
            process.exit(0);
        } catch (err) {
            client.logger.error('Shutdown error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'arrêt')] });
        }
    }
};

const embeds = require('../../utils/embeds');

module.exports = {
    name: 'support',
    description: 'Donne le le contact du createur du bot',
    category: 'utility',
    aliases: ['serveur', 'aide'],
    cooldown: 10,

    async execute(message, args, client) {
        try {
            const embed = embeds.info('', '🆘 Support', {
                fields: [
                    { name: '🔗 ID/@', value: '<@1431362559079874630> ou @gsx-r6', inline: false },
                    { name: '📧 Contact', value: 'Contacte moi pour obtenir de l\'aide et du support.', inline: false },
                    { name: '📖 Documentation', value: 'Utilisez `+help` pour voir toutes les commandes', inline: false }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Support command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du support.')] });
        }
    }
};

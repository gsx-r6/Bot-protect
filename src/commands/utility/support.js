const embeds = require('../../utils/embeds');

module.exports = {
    name: 'support',
    description: 'Donne le lien du serveur support',
    category: 'utility',
    aliases: ['serveur', 'aide'],
    cooldown: 10,
    
    async execute(message, args, client) {
        try {
            const embed = embeds.info('', '🆘 Serveur de Support', {
                fields: [
                    { name: '🔗 Lien du serveur', value: 'https://discord.gg/votre-serveur-support', inline: false },
                    { name: '📧 Contact', value: 'Rejoignez notre serveur pour obtenir de l\'aide et du support.', inline: false },
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

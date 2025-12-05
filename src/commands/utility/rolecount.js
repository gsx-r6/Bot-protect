const embeds = require('../../utils/embeds');

module.exports = {
    name: 'rolecount',
    description: 'Nombre de rôles sur le serveur',
    category: 'utility',
    aliases: ['roles', 'rolesc'],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const roleCount = message.guild.roles.cache.size;
            const topRoles = message.guild.roles.cache
                .sort((a, b) => b.position - a.position)
                .first(10)
                .map(r => r.toString())
                .join(', ');

            const embed = embeds.info('', `🎭 Rôles de ${message.guild.name}`, {
                fields: [
                    { name: '📊 Nombre total', value: `${roleCount} rôles`, inline: true },
                    { name: '👑 Top 10 rôles', value: topRoles || 'Aucun', inline: false }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Rolecount command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du comptage des rôles.')] });
        }
    }
};

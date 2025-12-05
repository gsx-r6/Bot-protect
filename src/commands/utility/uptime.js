const embeds = require('../../utils/embeds');

module.exports = {
    name: 'uptime',
    description: 'Afficher le uptime du bot',
    category: 'utility',
    async execute(message, args, client) {
        try {
            const ms = client.uptime || 0;
            return message.reply({ embeds: [embeds.info(msToHuman(ms), 'Uptime')] });
        } catch (err) {
            client.logger.error('Error in uptime: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération de l\'uptime')] });
        }
    }
};

function msToHuman(ms) {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / (60 * 1000)) % 60;
    const h = Math.floor(ms / (60 * 60 * 1000)) % 24;
    const d = Math.floor(ms / (24 * 60 * 60 * 1000));
    return `${d}d ${h}h ${m}m ${s}s`;
}

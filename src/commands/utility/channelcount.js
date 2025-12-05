const embeds = require('../../utils/embeds');

module.exports = {
    name: 'channelcount',
    description: 'Nombre de salons sur le serveur',
    category: 'utility',
    aliases: ['channels', 'salons'],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const channels = message.guild.channels.cache;
            const textChannels = channels.filter(c => c.type === 0).size;
            const voiceChannels = channels.filter(c => c.type === 2).size;
            const categories = channels.filter(c => c.type === 4).size;
            const total = channels.size;

            const embed = embeds.info('', `📁 Salons de ${message.guild.name}`, {
                fields: [
                    { name: '📊 Total', value: `${total} salons`, inline: true },
                    { name: '💬 Textuels', value: `${textChannels}`, inline: true },
                    { name: '🔊 Vocaux', value: `${voiceChannels}`, inline: true },
                    { name: '📂 Catégories', value: `${categories}`, inline: true }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Channelcount command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du comptage des salons.')] });
        }
    }
};

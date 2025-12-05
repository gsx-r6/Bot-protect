const embeds = require('../../utils/embeds');

module.exports = {
    name: 'ping',
    description: 'Teste la latence du bot',
    category: 'utility',
    aliases: ['latency'],
    cooldown: 3,
    
    async execute(message, args, client) {
        try {
            const sent = await message.reply('🏓 Ping...');
            const latency = sent.createdTimestamp - message.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);
            
            let status = '🟢 Excellent';
            if (latency > 200 || apiLatency > 200) status = '🟡 Moyen';
            if (latency > 500 || apiLatency > 500) status = '🟠 Lent';
            if (latency > 1000 || apiLatency > 1000) status = '🔴 Très lent';
            
            const embed = embeds.info('', '🏓 Pong !', {
                fields: [
                    { name: '💬 Latence du bot', value: `\`${latency}ms\``, inline: true },
                    { name: '🌐 Latence API Discord', value: `\`${apiLatency}ms\``, inline: true },
                    { name: '📊 Statut', value: status, inline: true }
                ]
            });
            
            await sent.edit({ content: '', embeds: [embed] });
            client.logger.command(`PING used by ${message.author.tag}`);
            
        } catch (err) {
            client.logger.error('Ping command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du test de latence.')] });
        }
    }
};

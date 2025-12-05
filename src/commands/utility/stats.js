const embeds = require('../../utils/embeds');
const os = require('os');

module.exports = {
    name: 'stats',
    description: 'Statistiques globales du bot',
    category: 'utility',
    aliases: ['statistics', 'botstat'],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const guilds = client.guilds.cache.size;
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const channels = client.channels.cache.size;
            const uptime = msToHuman(client.uptime || 0);
            const commands = client.commands.size;

            const embed = embeds.info('', '📊 Statistiques de {+} Nami', {
                fields: [
                    { name: '🏠 Serveurs', value: `\`${guilds}\``, inline: true },
                    { name: '👥 Utilisateurs', value: `\`${totalUsers}\``, inline: true },
                    { name: '📺 Salons', value: `\`${channels}\``, inline: true },
                    { name: '⚡ Commandes', value: `\`${commands}\``, inline: true },
                    { name: '🏓 Ping', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
                    { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true },
                    { name: '💾 Mémoire', value: `\`${memUsage}MB / ${totalMem}GB\``, inline: true },
                    { name: '🖥️ OS', value: `\`${os.platform()}\``, inline: true },
                    { name: '📦 Node.js', value: `\`${process.version}\``, inline: true }
                ],
                thumbnail: client.user.displayAvatarURL({ dynamic: true })
            });
            
            return message.reply({ embeds: [embed] });
            
        } catch (err) {
            client.logger.error('Error in stats: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération des stats')] });
        }
    }
};

function msToHuman(ms) {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / (60 * 1000)) % 60;
    const h = Math.floor(ms / (60 * 60 * 1000)) % 24;
    const d = Math.floor(ms / (24 * 60 * 60 * 1000));
    return `${d}j ${h}h ${m}m ${s}s`;
}

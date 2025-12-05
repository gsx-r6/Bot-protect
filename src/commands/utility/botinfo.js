const { version } = require('discord.js');
const embeds = require('../../utils/embeds');
const os = require('os');

module.exports = {
    name: 'botinfo',
    description: 'Informations techniques sur le bot',
    category: 'utility',
    aliases: ['bi', 'about'],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            
            const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            
            const embed = embeds.info('', '🤖 Informations sur {+} Nami', {
                fields: [
                    { name: '📊 Statistiques', value: `\`\`\`\nServeurs: ${client.guilds.cache.size}\nUtilisateurs: ${totalMembers}\nSalons: ${client.channels.cache.size}\nCommandes: ${client.commands.size}\`\`\``, inline: true },
                    { name: '⚙️ Technique', value: `\`\`\`\nNode.js: ${process.version}\nDiscord.js: v${version}\nMémoire: ${memUsage} MB\nPlateforme: ${os.platform()}\`\`\``, inline: true },
                    { name: '⏱️ Uptime', value: `\`\`\`\n${days}j ${hours}h ${minutes}m ${seconds}s\`\`\``, inline: false },
                    { name: '🔗 Liens', value: `[Inviter le bot](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot) • [Support](https://discord.gg/votre-serveur)`, inline: false }
                ],
                thumbnail: client.user.displayAvatarURL({ dynamic: true })
            });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur botinfo:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

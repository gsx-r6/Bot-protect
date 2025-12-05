const embeds = require('../../utils/embeds');

module.exports = {
    name: 'membercount',
    description: 'Nombre de membres sur le serveur',
    category: 'utility',
    aliases: ['members', 'mc'],
    cooldown: 3,
    
    async execute(message, args, client) {
        try {
            const guild = message.guild;
            await guild.members.fetch();
            
            const total = guild.memberCount;
            const humans = guild.members.cache.filter(m => !m.user.bot).size;
            const bots = guild.members.cache.filter(m => m.user.bot).size;
            const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
            
            const embed = embeds.info('', '👥 Statistiques des membres', {
                fields: [
                    { name: '📊 Total', value: `\`${total}\` membres`, inline: true },
                    { name: '👤 Humains', value: `\`${humans}\` humains`, inline: true },
                    { name: '🤖 Bots', value: `\`${bots}\` bots`, inline: true },
                    { name: '🟢 En ligne', value: `\`${online}\` en ligne`, inline: true },
                    { name: '⚫ Hors ligne', value: `\`${total - online}\` hors ligne`, inline: true },
                    { name: '📈 Ratio', value: `${((humans / total) * 100).toFixed(1)}% humains`, inline: true }
                ],
                thumbnail: guild.iconURL({ dynamic: true })
            });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur membercount:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'restartbot',
    description: 'Redémarre le bot',
    category: 'administration',
    aliases: ['restart', 'reboot'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 60,
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            if (message.author.id !== client.config.OWNER_ID.toString()) {
                return message.reply({ embeds: [embeds.error('Seul le propriétaire du bot peut redémarrer le bot.')] });
            }

            const embed = embeds.info('Le bot va redémarrer...', '🔄 Redémarrage');
            await message.reply({ embeds: [embed] });

            client.logger.command(`RESTARTBOT by ${message.author.tag}`);
            
            setTimeout(() => {
                process.exit(0);
            }, 2000);
        } catch (err) {
            client.logger.error('Restartbot command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du redémarrage.')] });
        }
    }
};

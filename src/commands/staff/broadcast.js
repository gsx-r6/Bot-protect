const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'broadcast',
    description: 'Envoie une annonce globale',
    category: 'staff',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 60,
    usage: '[message]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            if (!args[0]) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir un message.\nUsage: `+broadcast Votre annonce`')] });
            }

            const announcement = args.join(' ');

            if (announcement.includes('@everyone') || announcement.includes('@here')) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas utiliser @everyone ou @here.')] });
            }

            const embed = embeds.info('', '📢 Annonce Officielle', {
                fields: [
                    { name: '📝 Message', value: announcement, inline: false },
                    { name: '👤 Par', value: message.author.tag, inline: true },
                    { name: '📅 Date', value: new Date().toLocaleString('fr-FR'), inline: true }
                ]
            });

            await message.delete().catch(() => {});
            await message.channel.send({ embeds: [embed] });

            client.logger.command(`BROADCAST by ${message.author.tag}: ${announcement.substring(0, 50)}`);
        } catch (err) {
            client.logger.error('Broadcast command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'envoi de l\'annonce.')] });
        }
    }
};

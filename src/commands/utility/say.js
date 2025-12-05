const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'say',
    description: 'Faire parler le bot',
    category: 'utility',
    aliases: ['dire', 'echo'],
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 5,
    usage: '[message]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (!args[0]) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir un message.\nUsage: `+say Votre message`')] });
            }

            const content = args.join(' ');
            
            if (content.includes('@everyone') || content.includes('@here')) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas mentionner @everyone ou @here.')] });
            }

            await message.delete().catch(() => {});
            await message.channel.send(content);

            client.logger.command(`SAY by ${message.author.tag}: ${content.substring(0, 50)}`);
        } catch (err) {
            client.logger.error('Say command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'envoi du message.')] });
        }
    }
};

const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'embed',
    description: 'Créer un embed personnalisé',
    category: 'utility',
    aliases: ['createembed'],
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 10,
    usage: '[titre | description]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const input = args.join(' ');
            if (!input.includes('|')) {
                return message.reply({ embeds: [embeds.error('Format incorrect.\nUsage: `+embed Titre | Description`')] });
            }

            const [title, description] = input.split('|').map(s => s.trim());

            if (!title || !description) {
                return message.reply({ embeds: [embeds.error('Le titre et la description sont requis.')] });
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(client.config.EMBED_COLOR || '#FF69B4')
                .setTimestamp()
                .setFooter({ text: `Créé par ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

            await message.delete().catch(() => {});
            await message.channel.send({ embeds: [embed] });

            client.logger.command(`EMBED created by ${message.author.tag}`);
        } catch (err) {
            client.logger.error('Embed command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la création de l\'embed.')] });
        }
    }
};

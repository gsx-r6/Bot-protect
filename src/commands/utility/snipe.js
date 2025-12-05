const { EmbedBuilder } = require('discord.js');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'snipe',
    description: 'Afficher le dernier message supprimé dans le salon',
    category: 'utility',
    cooldown: 5,
    async execute(message, args, client) {
        const snipes = client.snipes;
        if (!snipes) return message.reply('Aucun message supprimé enregistré récemment.');

        const snipe = snipes.get(message.channel.id);
        if (!snipe) return message.reply('Aucun message supprimé à récupérer dans ce salon.');

        const color = ConfigService.getEmbedColor(message.guild.id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: snipe.author.tag, iconURL: snipe.author.displayAvatarURL() })
            .setDescription(snipe.content || '*Contenu non textuel (image)*')
            .setFooter({ text: `Supprimé à ${snipe.date.toLocaleTimeString('fr-FR')}` })
            .setTimestamp(snipe.date);

        if (snipe.image) {
            embed.setImage(snipe.image);
        }

        await message.reply({ embeds: [embed] });
    }
};

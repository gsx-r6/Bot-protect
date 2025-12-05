const { EmbedBuilder } = require('discord.js');
const ConfigService = require('../../services/ConfigService');
const { resolveMember } = require('../../utils/validators');

module.exports = {
    name: 'banner',
    description: 'Afficher la bannière d\'un membre',
    category: 'information',
    aliases: ['banniere'],
    cooldown: 3,
    async execute(message, args, client) {
        let target = await resolveMember(message.guild, args[0]) || message.member;

        // Il faut fetch l'user pour avoir la bannière
        const user = await client.users.fetch(target.id, { force: true });
        const color = ConfigService.getEmbedColor(message.guild.id);

        if (!user.banner) {
            return message.reply('Ce membre n\'a pas de bannière.');
        }

        const bannerURL = user.bannerURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Bannière de ${user.username}`)
            .setImage(bannerURL)
            .setFooter({ text: 'Nami Protect ⚡' });

        const row = {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 5,
                    label: 'Lien de la bannière',
                    url: bannerURL
                }
            ]
        };

        await message.reply({ embeds: [embed], components: [row] });
    }
};

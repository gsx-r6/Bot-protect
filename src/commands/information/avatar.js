const { EmbedBuilder } = require('discord.js');
const ConfigService = require('../../services/ConfigService');
const { resolveMember } = require('../../utils/validators');

module.exports = {
    name: 'avatar',
    description: 'Afficher la photo de profil d\'un membre',
    category: 'information',
    aliases: ['pp', 'pdp', 'pic'],
    cooldown: 3,
    async execute(message, args, client) {
        const target = await resolveMember(message.guild, args[0]) || message.member;
        const color = ConfigService.getEmbedColor(message.guild.id);

        const avatarURL = target.user.displayAvatarURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Avatar de ${target.user.username}`)
            .setImage(avatarURL)
            .setFooter({ text: 'Nami Protect ⚡' });

        const row = {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 5,
                    label: 'Lien de l\'avatar',
                    url: avatarURL
                }
            ]
        };

        await message.reply({ embeds: [embed], components: [row] });
    }
};

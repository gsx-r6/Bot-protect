const { EmbedBuilder } = require('discord.js');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'perms',
    description: 'Afficher le système de permissions du serveur',
    category: 'utility',
    aliases: ['permissions', 'perm'],
    cooldown: 5,

    async execute(message, args, client) {
        try {
            const color = ConfigService.getEmbedColor(message.guild.id);

            const permissionLevels = {
                1: ['1434622771299745914'],
                2: ['1434622766765707478'],
                3: ['1434622759354368171', '1434622757953601556'],
                4: ['1434622753054392430', '1434622752014340337'],
                5: ['1434622747799191593', '1434622747006341362'],
                6: ['1434622723346272489', '1434622721148322084'],
                7: ['1434622709513588826', '1434622705436459079', '1434622704413048852', '1434622698721509579', '1434622696716636184'],
                8: ['1434622693592010783', '1434622692429926560'],
                9: ['1434622681629851718', '1434622678983249950'],
                10: ['1434622699547656295', '1434622680455184395', '1434622675266830610'],
                11: ['1434622674356670625', '1434622671454343188', '1434947767477866559']
            };

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('╔═══════════════════════════════╗')
                .setDescription('**『 SYSTÈME DE PERMISSIONS 』**\n╚═══════════════════════════════╝\n\u200b')
                .setFooter({ text: 'Nami Protect ⚡', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            for (let level = 1; level <= 11; level++) {
                const roleIds = permissionLevels[level];
                const roles = roleIds
                    .map(id => {
                        const role = message.guild.roles.cache.get(id);
                        return role ? role.toString() : `<@&${id}>`;
                    });

                const levelEmoji = level === 1 ? '👑' :
                    level === 2 ? '⭐' :
                        level === 3 ? '💎' :
                            level === 4 ? '🔷' :
                                level === 5 ? '🔶' :
                                    level === 6 ? '🟦' :
                                        level === 7 ? '🟨' :
                                            level === 8 ? '🟧' :
                                                level === 9 ? '🟩' :
                                                    level === 10 ? '⚜️' :
                                                        '🎖️';

                const levelName = `${levelEmoji} ┃ Perm ${level}`;
                const rolesText = roles.length > 0 ? roles.join(' ') : 'Aucun rôle';

                embed.addFields({
                    name: levelName,
                    value: `${rolesText}\n━━━━━━━━━━━━━━━━━━━━━━━━`,
                    inline: false
                });
            }

            embed.addFields({
                name: '\u200b',
                value: '```fix\nChaque niveau de permission donne accès à des commandes et fonctionnalités spécifiques du serveur.```',
                inline: false
            });

            await message.reply({ embeds: [embed] });
            client.logger.command(`PERMS: Used by ${message.author.tag} in ${message.guild.id}`);

        } catch (err) {
            client.logger.error('Error in perms command: ' + err.stack);
            const embeds = require('../../utils/embeds');
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage des permissions.')] });
        }
    }
};

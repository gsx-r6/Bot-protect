const embeds = require('../../utils/embeds');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'serverlist',
    description: 'Affiche la liste des serveurs où le bot est présent',
    category: 'utility',
    aliases: ['guilds', 'servers', 'sl'],
    cooldown: 10,
    permissions: [],
    ownerOnly: true,
    
    async execute(message, args, client) {
        try {
            const guilds = client.guilds.cache;
            
            if (guilds.size === 0) {
                return message.reply({ embeds: [embeds.warning('Le bot n\'est dans aucun serveur.')] });
            }

            const guildList = guilds.map((guild, index) => {
                const owner = guild.ownerId;
                const memberCount = guild.memberCount;
                const createdAt = Math.floor(guild.createdTimestamp / 1000);
                
                return `**${guilds.size === 1 ? '' : `${Array.from(guilds.values()).indexOf(guild) + 1}.`} ${guild.name}**\n` +
                       `└ ID: \`${guild.id}\`\n` +
                       `└ Membres: **${memberCount}**\n` +
                       `└ Propriétaire: <@${owner}>\n` +
                       `└ Créé: <t:${createdAt}:R>\n`;
            });

            const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);

            let description = `**Total: ${guilds.size} serveur${guilds.size > 1 ? 's' : ''}**\n`;
            description += `**Membres totaux: ${totalMembers}**\n\n`;
            description += guildList.join('\n');

            if (description.length > 4096) {
                description = description.substring(0, 4000) + '\n\n... (liste tronquée)';
            }

            const embed = embeds.info(
                description,
                '📊 Liste des serveurs',
                {
                    footer: { text: `${client.user.tag} • ${guilds.size} serveur${guilds.size > 1 ? 's' : ''}` },
                    thumbnail: client.user.displayAvatarURL({ dynamic: true })
                }
            );
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur serverlist:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue lors de la récupération des serveurs.')] });
        }
    }
};

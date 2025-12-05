const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'roleinfo',
    description: 'Détails sur un rôle précis',
    category: 'information',
    aliases: ['ri'],
    cooldown: 3,
    usage: '<@rôle>',
    
    async execute(message, args, client) {
        try {
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
            
            if (!role) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un rôle ou fournir son ID.')] });
            }
            
            const permissions = role.permissions.toArray().map(p => `\`${p}\``).join(', ') || 'Aucune';
            const created = `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`;
            
            const embed = embeds.info('', `🎭 Informations sur le rôle`, {
                fields: [
                    { name: '📝 Nom', value: `${role.name}`, inline: true },
                    { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
                    { name: '🎨 Couleur', value: `${role.hexColor}`, inline: true },
                    { name: '👥 Membres', value: `${role.members.size}`, inline: true },
                    { name: '📍 Position', value: `${role.position}`, inline: true },
                    { name: '📅 Créé', value: created, inline: true },
                    { name: '🔀 Mentionnable', value: role.mentionable ? '✅ Oui' : '❌ Non', inline: true },
                    { name: '📌 Affiché séparément', value: role.hoist ? '✅ Oui' : '❌ Non', inline: true },
                    { name: '🤖 Géré par bot', value: role.managed ? '✅ Oui' : '❌ Non', inline: true },
                    { name: '🔐 Permissions', value: permissions.slice(0, 1024), inline: false }
                ]
            });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur roleinfo:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

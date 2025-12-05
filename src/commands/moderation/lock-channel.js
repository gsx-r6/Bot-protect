const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'lock-channel',
    description: 'Verrouiller un salon (permissions everyone SEND_MESSAGES false)',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ManageChannels],
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
            if (!channel) return message.reply({ embeds: [embeds.error('Salon introuvable')] });

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: false, ADD_REACTIONS: false });
            await message.reply({ embeds: [embeds.success(`Salon ${channel} verrouillé.`)] });
            client.logger.command(`LOCK: ${channel.id} by ${message.author.tag}`);
        } catch (err) {
            client.logger.error('Error in lock-channel command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du verrouillage.')] });
        }
    }
};

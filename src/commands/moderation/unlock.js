const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const { validatePermissions } = require('../../handlers/permissionHandler');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'unlock',
    description: 'Déverrouiller un salon',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ManageChannels],
    cooldown: 3,
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });

            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
            if (!channel) return message.reply({ embeds: [embeds.error('Salon introuvable')] });

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: true, ADD_REACTIONS: true });
            await message.reply({ embeds: [embeds.success(`Le salon ${channel} est désormais déverrouillé.`)] });
            client.logger.command(`UNLOCK: ${channel.id} by ${message.author.tag}`);
        } catch (err) {
            client.logger.error('Error in unlock command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du déverrouillage.')] });
        }
    }
};

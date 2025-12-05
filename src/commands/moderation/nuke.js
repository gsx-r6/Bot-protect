const embeds = require('../../utils/embeds');
const { PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Supprimer et recréer un salon propre',
    category: 'moderation',
    aliases: ['recreate'],
    cooldown: 10,
    usage: '[#salon]',
    permissions: [PermissionsBitField.Flags.ManageChannels],
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de gérer les salons.')] });
            }
            
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply({ embeds: [embeds.error('Je n\'ai pas la permission de gérer les salons.')] });
            }
            
            const channel = message.mentions.channels.first() || message.channel;
            
            if (channel.type !== ChannelType.GuildText) {
                return message.reply({ embeds: [embeds.error('Je ne peux nuker que des salons textuels.')] });
            }
            
            const position = channel.position;
            const parent = channel.parent;
            const name = channel.name;
            const topic = channel.topic;
            const nsfw = channel.nsfw;
            const rateLimitPerUser = channel.rateLimitPerUser;
            const permissionOverwrites = channel.permissionOverwrites.cache;
            
            await channel.delete(`Nuke par: ${message.author.tag}`);
            
            const newChannel = await message.guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                parent: parent,
                topic: topic,
                nsfw: nsfw,
                rateLimitPerUser: rateLimitPerUser,
                position: position,
                permissionOverwrites: permissionOverwrites
            });
            
            const embed = embeds.moderation(
                `💣 **Salon nuke avec succès !**\n\n` +
                `Tous les messages ont été supprimés et le salon a été recréé.\n\n` +
                `**Modérateur:** ${message.author}`,
                '💥 Nuke'
            );
            
            await newChannel.send({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur nuke:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

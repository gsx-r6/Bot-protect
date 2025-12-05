const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Supprimer un grand nombre de messages rapidement',
    category: 'moderation',
    aliases: ['prune'],
    cooldown: 5,
    usage: '<nombre>',
    permissions: [PermissionsBitField.Flags.ManageMessages],
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de gérer les messages.')] });
            }
            
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply({ embeds: [embeds.error('Je n\'ai pas la permission de gérer les messages.')] });
            }
            
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir un nombre entre 1 et 100.')] });
            }
            
            await message.delete();
            
            const deleted = await message.channel.bulkDelete(amount, true);
            
            const embed = embeds.moderation(
                `✅ **${deleted.size} messages supprimés avec succès**\n\n` +
                `**Salon:** ${message.channel}\n` +
                `**Modérateur:** ${message.author}`,
                '🗑️ Purge'
            );
            
            const reply = await message.channel.send({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            
        } catch (error) {
            client.logger.error('Erreur purge:', error);
            await message.channel.send({ embeds: [embeds.error('Une erreur est survenue. Les messages de plus de 14 jours ne peuvent pas être supprimés.')] });
        }
    }
};

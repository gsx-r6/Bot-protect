const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Supprimer un nombre de messages (max 100)',
    category: 'moderation',
    aliases: ['purge', 'prune'],
    cooldown: 3,
    usage: '<nombre>',
    permissions: [PermissionsBitField.Flags.ManageMessages],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply({ embeds: [embeds.error('Je n\'ai pas la permission de gérer les messages.')] });
            }

            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || amount <= 0 || amount > 100) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir un nombre entre 1 et 100')] });
            }

            // Supprimer d'abord le message de commande
            await message.delete().catch(() => { });

            const deleted = await message.channel.bulkDelete(amount, true);

            const embed = embeds.moderation(
                `✅ **${deleted.size} messages supprimés avec succès**\n\n` +
                `**Salon:** ${message.channel}\n` +
                `**Modérateur:** ${message.author}`,
                '🗑️ Nettoyage'
            );

            client.logger.command(`CLEAR/PURGE: ${deleted.size} messages by ${message.author.tag} in ${message.guild.id}`);

            const reply = await message.channel.send({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => { }), 5000);

        } catch (err) {
            client.logger.error('Error in clear command: ' + err.stack);
            return message.channel.send({ embeds: [embeds.error('Erreur lors de la suppression des messages. Les messages de plus de 14 jours ne peuvent pas être supprimés par Discord.')] });
        }
    }
};

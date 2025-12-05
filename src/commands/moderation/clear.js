const embeds = require('../../utils/embeds');

module.exports = {
    name: 'clear',
    description: 'Supprimer un nombre de messages (max 100)',
    category: 'moderation',
    permissions: ['ManageMessages'],
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has('ManageMessages')) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || amount <= 0 || amount > 100) return message.reply({ embeds: [embeds.error('Veuillez fournir un nombre entre 1 et 100')] });
            await message.channel.bulkDelete(amount, true);
            client.logger.command(`CLEAR: ${amount} messages by ${message.author.tag} in ${message.guild.id}`);
            return message.reply({ embeds: [embeds.success(`Suppression de ${amount} messages.`)] }).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));
        } catch (err) {
            client.logger.error('Error in clear command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la suppression des messages.')] });
        }
    }
};

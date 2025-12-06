const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'reroll',
    description: 'Relancer un giveaway pour choisir de nouveaux gagnants',
    category: 'utility',
    aliases: ['greroll'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    usage: '<message_id>',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (!args[0]) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID du message du giveaway.\nUtilisation: `+reroll <message_id>`')] });
            }

            const messageId = args[0];

            // Chercher le message
            let giveawayMsg;
            try {
                giveawayMsg = await message.channel.messages.fetch(messageId);
            } catch (e) {
                return message.reply({ embeds: [embeds.error('Message introuvable dans ce salon')] });
            }

            // Vérifier que c'est un giveaway
            if (!giveawayMsg.embeds[0] || !giveawayMsg.embeds[0].title?.includes('GIVEAWAY')) {
                return message.reply({ embeds: [embeds.error('Ce message n\'est pas un giveaway')] });
            }

            // Récupérer les participants
            const reaction = giveawayMsg.reactions.cache.get('🎉');
            if (!reaction) {
                return message.reply({ embeds: [embeds.error('Aucune réaction 🎉 sur ce giveaway')] });
            }

            const users = await reaction.users.fetch();
            const participants = users.filter(u => !u.bot);

            if (participants.size === 0) {
                return message.reply({ embeds: [embeds.error('Aucun participant valide')] });
            }

            // Extraire le nombre de gagnants de l'embed original
            const description = giveawayMsg.embeds[0].description;
            const winnersMatch = description.match(/\*\*Gagnants:\*\* (\d+)/);
            const winnersCount = winnersMatch ? parseInt(winnersMatch[1]) : 1;

            // Sélectionner de nouveaux gagnants
            const actualWinners = Math.min(winnersCount, participants.size);
            const winnersArray = participants.random(actualWinners);
            const winners = Array.isArray(winnersArray) ? winnersArray : [winnersArray];

            // Extraire le prix
            const prizeMatch = description.match(/\*\*Prix:\*\* (.+)/);
            const prize = prizeMatch ? prizeMatch[1].split('\n')[0] : 'Inconnu';

            // Annoncer les nouveaux gagnants
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🔄 GIVEAWAY REROLL 🔄')
                .setDescription(`**Prix:** ${prize}\n\n**Nouveaux gagnant(s):**\n${winners.map(w => `🏆 ${w}`).join('\n')}\n\nFélicitations !`)
                .setFooter({ text: `Reroll par ${message.author.tag}` })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            client.logger.command(`GIVEAWAY REROLL by ${message.author.tag}: ${messageId}`);

        } catch (err) {
            client.logger.error('Reroll command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du reroll')] });
        }
    }
};

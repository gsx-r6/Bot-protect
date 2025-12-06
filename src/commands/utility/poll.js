const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'poll',
    description: 'Créer un sondage',
    category: 'utility',
    aliases: ['sondage', 'vote'],
    permissions: [PermissionFlagsBits.ManageMessages],
    cooldown: 10,
    usage: '<question> | <option1> | <option2> | ...',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (args.length === 0) {
                return message.reply({ embeds: [embeds.error('Utilisation: `+poll <question> | <option1> | <option2> | ...`\nExemple: `+poll Quelle couleur ? | Rouge | Bleu | Vert`')] });
            }

            const fullText = args.join(' ');
            const parts = fullText.split('|').map(p => p.trim());

            if (parts.length < 2) {
                return message.reply({ embeds: [embeds.error('Vous devez fournir au moins une question et une option.\nSéparez avec `|`')] });
            }

            const question = parts[0];
            const options = parts.slice(1);

            if (options.length > 10) {
                return message.reply({ embeds: [embeds.error('Maximum 10 options autorisées')] });
            }

            // Emojis pour les options
            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📊 SONDAGE')
                .setDescription(`**${question}**\n\n${options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n')}`)
                .setFooter({ text: `Sondage créé par ${message.author.tag}` })
                .setTimestamp();

            const pollMsg = await message.channel.send({ embeds: [embed] });

            // Ajouter les réactions
            for (let i = 0; i < options.length; i++) {
                await pollMsg.react(emojis[i]);
            }

            // Supprimer le message de commande
            await message.delete().catch(() => { });

            client.logger.command(`POLL created by ${message.author.tag}: ${question} (${options.length} options)`);

        } catch (err) {
            client.logger.error('Poll command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la création du sondage')] });
        }
    }
};

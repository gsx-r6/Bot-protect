const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const db = require('../../database/database');
const logger = require('../../utils/logger');

module.exports = {
    name: 'suggest',
    description: 'Soumettre une suggestion pour le serveur',
    category: 'utility',
    aliases: ['suggestion', 'idée'],
    cooldown: 60,
    usage: '<votre suggestion>',

    async execute(message, args, client) {
        try {
            // 1. Vérifier si le système est configuré
            // (Pour l'instant on utilise le salon actuel ou un salon 'suggestions' si trouvé)
            let suggestChannel = message.guild.channels.cache.find(c => c.name === 'suggestions' || c.name === 'idees');

            // Si configuré en DB (à faire plus tard), on le prendrait ici
            // const config = db.getGuildConfig(message.guild.id);
            // if (config?.suggestion_channel) ...

            if (!args.length) {
                return message.reply(`❌ Veuillez décrire votre suggestion.\nUsage: \`+suggest Ajouter des cookies\``);
            }

            const suggestionContent = args.join(' ');

            // Si pas de salon dédié, on demande à configurer ou on utilise le salon actuel
            if (!suggestChannel) {
                return message.reply(`⚠️ Aucun salon 'suggestions' trouvé. Veuillez en créer un ou renommer un salon existant.`);
            }

            // 2. Créer l'Embed UHQ
            const embed = new EmbedBuilder()
                .setColor('#FEE75C') // Jaune "En attente"
                .setAuthor({
                    name: `Suggestion de ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`**${suggestionContent}**`)
                .addFields(
                    { name: '📊 Status', value: '⏳ En attente de votes', inline: true },
                    { name: '👍 Pour', value: '0 (0%)', inline: true },
                    { name: '👎 Contre', value: '0 (0%)', inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Utilisez les boutons ci-dessous pour voter !' })
                .setTimestamp();

            // 3. Créer les Boutons Interactifs
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('suggest_upvote')
                        .setLabel('Pour')
                        .setEmoji('👍')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('suggest_downvote')
                        .setLabel('Contre')
                        .setEmoji('👎')
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId('suggest_manage')
                        .setLabel('Gérer')
                        .setEmoji('⚙️')
                        .setStyle(ButtonStyle.Secondary)
                );

            // 4. Envoyer dans le salon suggestions
            const suggestMessage = await suggestChannel.send({ embeds: [embed], components: [row] });

            // 5. Créer un Thread automatique (si possible)
            if (suggestChannel.type !== ChannelType.GuildVoice) {
                try {
                    await suggestMessage.startThread({
                        name: `Discussion : ${suggestionContent.substring(0, 50)}...`,
                        autoArchiveDuration: 1440, // 24h
                        reason: 'Thread de discussion suggestion'
                    });
                } catch (e) {
                    logger.warn(`Impossible de créer un thread pour la suggestion: ${e.message}`);
                }
            }

            // 6. Confirmation et nettoyage
            await message.reply({ content: `✅ Suggestion envoyée dans ${suggestChannel} !`, ephemeral: true });
            if (message.deletable) message.delete().catch(() => { });

        } catch (err) {
            client.logger.error('Suggest Command Error: ' + err.stack);
            message.reply('Une erreur est survenue lors de l\'envoi de la suggestion.');
        }
    }
};

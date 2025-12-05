const embeds = require('../../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Génère le lien d\'invitation du bot',
    category: 'utility',
    aliases: ['inv'],
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
            
            const embed = embeds.info(
                `Merci de vouloir inviter **{+} Nami** sur votre serveur !\n\nCliquez sur le bouton ci-dessous pour m'ajouter.`,
                '🔗 Invitation du bot',
                {
                    thumbnail: client.user.displayAvatarURL({ dynamic: true }),
                    fields: [
                        { name: '✨ Fonctionnalités', value: '• Modération avancée\n• Protection anti-raid\n• Système de logs\n• Statistiques en temps réel', inline: false }
                    ]
                }
            );
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Inviter {+} Nami')
                    .setURL(inviteURL)
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🤖')
            );
            
            await message.reply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            client.logger.error('Erreur invite:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

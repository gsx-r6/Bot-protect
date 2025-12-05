const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    name: 'ticket',
    description: 'Publie un panel pour créer des tickets (Administrateurs uniquement)',
    category: 'utility',
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has('Administrator')) return message.reply('Vous devez être administrateur pour publier le panel de tickets.');

            const embed = new EmbedBuilder()
                .setColor(client.config.EMBED_COLOR || '#2b2d31')
                .setTitle('Panel de support')
                .setDescription('Cliquez sur le bouton ci‑dessous pour créer un ticket privé au staff.')
                .setFooter({ text: 'Nami Protect | Système de tickets' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('nami_ticket_create')
                    .setLabel('Créer un ticket')
                    .setStyle(ButtonStyle.Success)
            );

            await message.channel.send({ embeds: [embed], components: [row] });
            await message.reply({ content: 'Panel de ticket publié.', ephemeral: true });
        } catch (err) {
            client.logger.error('ticket command error: ' + (err.stack || err.message));
            return message.reply('Impossible de publier le panel de tickets.');
        }
    }
};

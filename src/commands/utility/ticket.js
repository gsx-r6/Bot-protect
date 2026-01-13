const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'ticket',
    description: 'Publie un panel professionnel pour créer des tickets',
    category: 'tickets',
    aliases: ['ticketpanel', 'tickets'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    usage: '',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Vous devez avoir la permission Gérer le serveur pour publier le panel.')] });
            }

            const guildId = message.guild.id;
            const ticketConfig = db.getTicketConfig(guildId) || {};
            const guildColor = ConfigService.getEmbedColor(guildId);
            const prefix = ConfigService.getPrefix(guildId);

            const panelColor = ticketConfig.panel_color || guildColor || '#5865F2';
            const panelTitle = ticketConfig.panel_title || '🎫 Support Tickets';
            const panelDescription = ticketConfig.panel_description || 'Besoin d\'aide ? Cliquez sur le bouton ci-dessous pour créer un ticket et contacter notre équipe de support.';

            const stats = db.getTicketStats(guildId);

            const embed = new EmbedBuilder()
                .setColor(panelColor)
                .setTitle(panelTitle)
                .setDescription(panelDescription)
                .addFields(
                    {
                        name: '📋 Informations',
                        value: [
                            `• Décrivez votre problème de manière claire`,
                            `• Un membre du staff vous répondra rapidement`,
                            `• Ne créez pas plusieurs tickets pour le même sujet`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: `${message.guild.name} • ${stats.total} tickets traités`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            if (message.guild.iconURL()) {
                embed.setThumbnail(message.guild.iconURL({ dynamic: true, size: 256 }));
            }

            const categories = db.getTicketCategories(guildId);
            const components = [];

            if (categories.length > 0) {
                const { StringSelectMenuBuilder } = require('discord.js');
                const select = new StringSelectMenuBuilder()
                    .setCustomId('nami_ticket_category_select')
                    .setPlaceholder('Choisissez une catégorie de ticket...')
                    .addOptions(
                        categories.map(cat => ({
                            label: cat.label,
                            description: cat.description,
                            value: `cat_${cat.id}`,
                            emoji: cat.emoji
                        }))
                    );

                components.push(new ActionRowBuilder().addComponents(select));
            } else {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('nami_ticket_create')
                        .setLabel('Créer un ticket')
                        .setEmoji('📩')
                        .setStyle(ButtonStyle.Success)
                );
                components.push(row);
            }

            // Second row for other buttons
            const secondRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('nami_ticket_list')
                    .setLabel('Mes tickets')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Secondary)
            );
            components.push(secondRow);

            await message.channel.send({ embeds: [embed], components: components });

            const confirmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription('✅ Panel de tickets publié avec succès !')
                .setFooter({ text: `Utilisez ${prefix}ticketconfig pour personnaliser le panel` });

            await message.reply({ embeds: [confirmEmbed] });
            client.logger.command(`TICKET panel published by ${message.author.tag} in ${message.guild.name}`);

        } catch (err) {
            client.logger.error('Ticket command error: ' + (err.stack || err.message));
            return message.reply({ embeds: [embeds.error('Impossible de publier le panel de tickets.')] });
        }
    }
};

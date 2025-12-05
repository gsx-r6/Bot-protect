const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ConfigService = require('../../services/ConfigService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'mutepanel',
    description: 'Afficher le panel de mute interactif',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 5,
    usage: '<@membre>',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const targetMember = message.mentions.members.first();
            if (!targetMember) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre.\nUsage: `+mutepanel @membre`')] });
            }

            // Vérification Hiérarchie
            const PermissionHandler = require('../../utils/PermissionHandler');
            if (!PermissionHandler.checkHierarchy(message.member, targetMember)) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas ouvrir un panel de sanction contre ce membre (Hiérarchie supérieure ou égale).')] });
            }

            const color = ConfigService.getEmbedColor(message.guild.id);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🔇 Panel de Mute')
                .setDescription(`**Membre ciblé:** ${targetMember}\n\nSélectionnez une raison et une durée ci-dessous:`)
                .addFields(
                    { name: '🟡 Insulte légère', value: '10 minutes', inline: true },
                    { name: '🟠 Insulte grave', value: '20 minutes', inline: true },
                    { name: '🔴 Spam', value: '30 minutes', inline: true },
                    { name: '⚫ Flood', value: '1 heure', inline: true },
                    { name: '🟣 Provocation', value: '2 heures', inline: true },
                    { name: '🔵 Toxicité', value: '6 heures', inline: true }
                )
                .setFooter({ text: 'Nami Protect ⚡' })
                .setTimestamp();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_10m_insulte`)
                        .setLabel('Insulte - 10min')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🟡'),
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_20m_insultegrave`)
                        .setLabel('Insulte grave - 20min')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🟠'),
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_30m_spam`)
                        .setLabel('Spam - 30min')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔴')
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_1h_flood`)
                        .setLabel('Flood - 1h')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚫'),
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_2h_provocation`)
                        .setLabel('Provocation - 2h')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🟣'),
                    new ButtonBuilder()
                        .setCustomId(`mute_${targetMember.id}_6h_toxicite`)
                        .setLabel('Toxicité - 6h')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔵')
                );

            await message.reply({ embeds: [embed], components: [row1, row2] });
            client.logger.command(`MUTE PANEL: Used by ${message.author.tag} for ${targetMember.user.tag} in ${message.guild.id}`);

        } catch (err) {
            client.logger.error('Error in mutepanel command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du panel de mute.')] });
        }
    }
};

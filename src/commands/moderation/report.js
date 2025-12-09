const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const db = require('../../database/database');
const logger = require('../../utils/logger');

// NOTE: Cette commande contextuelle doit être enregistrée via un déploiement de commandes slash.
// Pour ce projet message-based, on va aussi créer une version commande texte '+report'.

module.exports = {
    // Version Commande Texte
    name: 'report',
    description: 'Signaler un membre ou un problème',
    category: 'moderation',
    usage: '<@utilisateur> [raison]',
    aliases: ['signaler'],

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply('❌ Usage: `+report @user <raison>` ou `+report <ID> <raison>`');
        }

        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            try {
                targetUser = await client.users.fetch(args[0]);
            } catch (e) {
                // ID invalide
            }
        }

        if (!targetUser) return message.reply('❌ Utilisateur introuvable (Vérifiez l\'ID ou la mention).');

        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';

        await this.handleReport(client, message.guild, message.author, target.user, reason, message);
    },

    // Logique commune
    async handleReport(client, guild, reporter, targetUser, reason, contextMessage = null) {
        // 1. Trouver le salon de logs reports
        // Idéalement configurable via DB : db.getLogChannel(guild.id, 'reports')
        // Pour l'instant on cherche un channel 'reports-log' ou 'mod-logs'
        const reportChannel = guild.channels.cache.find(c => c.name === 'reports-logs' || c.name === 'mod-logs');

        if (!reportChannel) {
            if (contextMessage) contextMessage.reply('❌ Aucun salon de logs configuré pour les reports.');
            return;
        }

        // 2. Créer l'Embed Report UHQ
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 Nouveau Signalement')
            .addFields(
                { name: '👤 Signaleur', value: `${reporter.tag} (${reporter.id})`, inline: true },
                { name: '🎯 Accusé', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '📝 Raison', value: reason, inline: false },
                { name: '🔗 Contexte', value: contextMessage ? `[Lien du message](${contextMessage.url})` : 'Commande Slash', inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Report ID: #' + Date.now().toString().slice(-6) });

        // 3. Boutons de Gestion Staff
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('report_claim')
                    .setLabel('Prise en charge')
                    .setEmoji('👀')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('report_resolve')
                    .setLabel('Résolu')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('report_dismiss')
                    .setLabel('Rejeter')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

        await reportChannel.send({ embeds: [embed], components: [row] });

        if (contextMessage) {
            contextMessage.reply({ content: '✅ Votre signalement a été transmis à l\'équipe de modération.', ephemeral: true });
            // Supprimer le message original si possible pour discrétion ? Non, faut garder la preuve.
        }
    }
};

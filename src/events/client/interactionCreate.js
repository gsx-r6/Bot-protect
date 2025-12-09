const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        try {
            // Note: Les interactions Tickets, Suggestions, Reports, Voice sont gérées par leurs fichiers respectifs dans /interactions/
            // Ce fichier ne sert plus que de 'catch-all' ou pour les legacy handlers non migrés (Mute Panel, Profile Delete).

            if (!interaction.isButton() && !interaction.isModalSubmit()) return;

            const customId = interaction.customId || '';

            // --- LEGACY HANDLERS (MUTE & PROFILE) ---
            if (customId.startsWith('mute_')) {
                return handleMutePanel(interaction, client, customId);
            }

            if (customId.startsWith('nami_profile_delete:')) {
                return handleProfileDelete(interaction, client, customId);
            }

        } catch (err) {
            client.logger.error('Error in interactionCreate event: ' + (err.stack || err.message));
        }
    }
};

async function handleMutePanel(interaction, client, customId) {
    await interaction.deferReply({ ephemeral: true });

    const parts = customId.split('_');
    const targetId = parts[1];
    const duration = parts[2];
    const reason = parts[3] || 'Aucune raison';

    const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (!targetMember) {
        return interaction.editReply({ content: 'Membre introuvable.' });
    }

    if (!interaction.member.permissions.has('ModerateMembers')) {
        return interaction.editReply({ content: 'Vous n\'avez pas la permission de mute des membres.' });
    }

    const PermissionHandler = require('../../utils/PermissionHandler');
    if (!PermissionHandler.checkRateLimit(interaction.member, 'mute')) {
        const remaining = PermissionHandler.getRemainingUses(interaction.member, 'mute');
        return interaction.editReply({ content: `❌ Limite atteinte. Mutes restants pour cette heure : ${remaining}` });
    }

    if (!PermissionHandler.checkHierarchy(interaction.member, targetMember)) {
        return interaction.editReply({ content: '❌ Vous ne pouvez pas sanctionner ce membre (Hiérarchie supérieure ou égale).' });
    }

    const durationMs = parseDuration(duration);
    if (!durationMs || durationMs <= 0) {
        return interaction.editReply({ content: 'Durée invalide.' });
    }

    const reasonText = reason.replace(/([A-Z])/g, ' $1').trim();

    try {
        await targetMember.timeout(durationMs, `${reasonText} — par ${interaction.user.tag}`);

        if (client.logs) {
            await client.logs.logModeration(interaction.guild, 'MUTE', {
                user: targetMember.user,
                moderator: interaction.user,
                reason: reasonText,
                duration: duration
            });
        }

        const remaining = PermissionHandler.getRemainingUses(interaction.member, 'mute');
        await interaction.editReply({ content: `✅ ${targetMember.user.tag} a été mute pour ${duration} (${reasonText})\n*Quota restant : ${remaining}*` });
        client.logger.command(`MUTE PANEL: ${targetMember.user.tag} by ${interaction.user.tag} - ${duration} - ${reasonText}`);

        try {
            await interaction.message.edit({ components: [] });
        } catch (e) { }
    } catch (err) {
        client.logger.error('Error muting member: ' + err.message);
        await interaction.editReply({ content: '❌ Erreur lors du mute du membre.' });
    }
}

async function handleProfileDelete(interaction, client, customId) {
    await interaction.deferReply({ ephemeral: true });
    const parts = customId.split(':');
    const targetId = parts[1];
    const isSelf = interaction.user.id === targetId;
    const canManage = interaction.member.permissions.has('ManageGuild');

    if (!isSelf && !canManage) {
        return interaction.editReply({ content: 'Vous n\'avez pas la permission de supprimer ces données.' });
    }

    db.deleteUserData(targetId);
    await interaction.editReply({ content: `Données de l'utilisateur <@${targetId}> supprimées.` });

    try {
        if (interaction.message && interaction.message.edit) {
            await interaction.message.edit({ components: [] });
        }
    } catch (e) { }
}

function parseDuration(duration) {
    const units = { s: 1000, sec: 1000, m: 60000, min: 60000, h: 3600000, hour: 3600000, d: 86400000, day: 86400000 };
    const match = /^([0-9]+)(s|sec|m|min|h|hour|d|day)$/.exec(duration);
    if (!match) return null;
    return parseInt(match[1], 10) * (units[match[2]] || 0);
}




async function handleMutePanel(interaction, client, customId) {
    await interaction.deferReply({ ephemeral: true });

    const parts = customId.split('_');
    const targetId = parts[1];
    const duration = parts[2];
    const reason = parts[3] || 'Aucune raison';

    const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (!targetMember) {
        return interaction.editReply({ content: 'Membre introuvable.' });
    }

    if (!interaction.member.permissions.has('ModerateMembers')) {
        return interaction.editReply({ content: 'Vous n\'avez pas la permission de mute des membres.' });
    }

    const PermissionHandler = require('../../utils/PermissionHandler');
    if (!PermissionHandler.checkRateLimit(interaction.member, 'mute')) {
        const remaining = PermissionHandler.getRemainingUses(interaction.member, 'mute');
        return interaction.editReply({ content: `❌ Limite atteinte. Mutes restants pour cette heure : ${remaining}` });
    }

    if (!PermissionHandler.checkHierarchy(interaction.member, targetMember)) {
        return interaction.editReply({ content: '❌ Vous ne pouvez pas sanctionner ce membre (Hiérarchie supérieure ou égale).' });
    }

    const durationMs = parseDuration(duration);
    if (!durationMs || durationMs <= 0) {
        return interaction.editReply({ content: 'Durée invalide.' });
    }

    const reasonText = reason.replace(/([A-Z])/g, ' $1').trim();

    try {
        await targetMember.timeout(durationMs, `${reasonText} — par ${interaction.user.tag}`);

        if (client.logs) {
            await client.logs.logModeration(interaction.guild, 'MUTE', {
                user: targetMember.user,
                moderator: interaction.user,
                reason: reasonText,
                duration: duration
            });
        }

        const remaining = PermissionHandler.getRemainingUses(interaction.member, 'mute');
        await interaction.editReply({ content: `✅ ${targetMember.user.tag} a été mute pour ${duration} (${reasonText})\n*Quota restant : ${remaining}*` });
        client.logger.command(`MUTE PANEL: ${targetMember.user.tag} by ${interaction.user.tag} - ${duration} - ${reasonText}`);

        try {
            await interaction.message.edit({ components: [] });
        } catch (e) { }
    } catch (err) {
        client.logger.error('Error muting member: ' + err.message);
        await interaction.editReply({ content: '❌ Erreur lors du mute du membre.' });
    }
}

async function handleProfileDelete(interaction, client, customId) {
    await interaction.deferReply({ ephemeral: true });
    const parts = customId.split(':');
    const targetId = parts[1];
    const isSelf = interaction.user.id === targetId;
    const canManage = interaction.member.permissions.has('ManageGuild');

    if (!isSelf && !canManage) {
        return interaction.editReply({ content: 'Vous n\'avez pas la permission de supprimer ces données.' });
    }

    db.deleteUserData(targetId);
    await interaction.editReply({ content: `Données de l'utilisateur <@${targetId}> supprimées.` });

    try {
        if (interaction.message && interaction.message.edit) {
            await interaction.message.edit({ components: [] });
        }
    } catch (e) { }
}

function parseDuration(duration) {
    const units = { s: 1000, sec: 1000, m: 60000, min: 60000, h: 3600000, hour: 3600000, d: 86400000, day: 86400000 };
    const match = /^([0-9]+)(s|sec|m|min|h|hour|d|day)$/.exec(duration);
    if (!match) return null;
    return parseInt(match[1], 10) * (units[match[2]] || 0);
}

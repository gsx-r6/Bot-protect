const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        try {
            if (!interaction.isButton()) return;

            const customId = interaction.customId || '';

            // Ticket creation
            if (customId === 'nami_ticket_create') {
                await interaction.deferReply({ ephemeral: true });
                const guild = interaction.guild;
                const owner = interaction.user;

                const safeName = `${owner.username.toLowerCase().replace(/[^a-z0-9\-]/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;

                const channel = await guild.channels.create({
                    name: `ticket-${safeName}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['ViewChannel'] },
                        { id: owner.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    ],
                });

                // record ticket
                db.addTicket(guild.id, channel.id, owner.id);

                const embed = new EmbedBuilder()
                    .setTitle('Ticket de support')
                    .setDescription(`Bonjour ${owner}, un membre du staff va arriver bientôt.`)
                    .setColor(client.config.EMBED_COLOR || '#2b2d31');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('nami_ticket_close')
                        .setLabel('Fermer le ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({ content: `${owner}`, embeds: [embed], components: [row] });

                await interaction.editReply({ content: `Ticket créé: ${channel}`, components: [], embeds: [] });
                return;
            }

            // Ticket closing (button inside ticket channel)
            if (customId === 'nami_ticket_close') {
                await interaction.deferReply({ ephemeral: true });
                const channel = interaction.channel;
                const ticket = db.getTicketByChannel(channel.id);
                if (!ticket) return interaction.editReply({ content: 'Ticket introuvable en base de données.' });

                const isOwner = interaction.user.id === ticket.owner;
                const canManage = interaction.member.permissions.has('ManageGuild');
                if (!isOwner && !canManage) return interaction.editReply({ content: 'Vous n\'avez pas la permission de fermer ce ticket.' });

                // close in DB then delete channel
                db.closeTicket(channel.id);
                await interaction.editReply({ content: 'Fermeture du ticket, suppression du salon...' });
                // small delay to allow message delivery
                setTimeout(async () => {
                    try { await channel.delete('Ticket fermé'); } catch (e) { client.logger.error('Error deleting ticket channel: ' + (e.stack || e.message)); }
                }, 1200);
                return;
            }

            // Mute panel buttons: customId = mute_<userid>_<duration>_<reason>
            if (customId.startsWith('mute_')) {
                await interaction.deferReply({ ephemeral: true });

                const parts = customId.split('_');
                const targetId = parts[1];
                const duration = parts[2];
                const reason = parts[3] || 'Aucune raison';

                const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
                if (!targetMember) {
                    return interaction.editReply({ content: 'Membre introuvable.' });
                }

                // 1. Permission Discord de base
                if (!interaction.member.permissions.has('ModerateMembers')) {
                    return interaction.editReply({ content: 'Vous n\'avez pas la permission de mute des membres.' });
                }

                // 2. Rate Limit
                const PermissionHandler = require('../../utils/PermissionHandler');
                if (!PermissionHandler.checkRateLimit(interaction.member, 'mute')) {
                    const remaining = PermissionHandler.getRemainingUses(interaction.member, 'mute');
                    return interaction.editReply({ content: `❌ Limite atteinte. Mutes restants pour cette heure : ${remaining}` });
                }

                // 3. Hiérarchie
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
                    } catch (e) {

                    }
                } catch (err) {
                    client.logger.error('Error muting member: ' + err.message);
                    await interaction.editReply({ content: '❌ Erreur lors du mute du membre.' });
                }
                return;
            }

            // Profile data deletion: customId = nami_profile_delete:<userid>
            if (customId.startsWith('nami_profile_delete:')) {
                await interaction.deferReply({ ephemeral: true });
                const parts = customId.split(':');
                const targetId = parts[1];
                const isSelf = interaction.user.id === targetId;
                const canManage = interaction.member.permissions.has('ManageGuild');
                if (!isSelf && !canManage) return interaction.editReply({ content: 'Vous n\'avez pas la permission de supprimer ces données.' });

                db.deleteUserData(targetId);
                await interaction.editReply({ content: `Données de l'utilisateur <@${targetId}> supprimées.` });

                // Try to update original message to remove buttons if possible
                try {
                    if (interaction.message && interaction.message.edit) {
                        await interaction.message.edit({ components: [] });
                    }
                } catch (e) {
                    // ignore
                }
                return;
            }

        } catch (err) {
            client.logger.error('Error in interactionCreate event: ' + (err.stack || err.message));
            try { if (interaction.deferred || interaction.replied) await interaction.editReply({ content: 'Une erreur est survenue.' }); else await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true }); } catch (_) { }
        }
    }
};

function parseDuration(duration) {
    const units = { s: 1000, sec: 1000, m: 60000, min: 60000, h: 3600000, hour: 3600000, d: 86400000, day: 86400000 };
    const match = /^([0-9]+)(s|sec|m|min|h|hour|d|day)$/.exec(duration);
    if (!match) return null;
    return parseInt(match[1], 10) * (units[match[2]] || 0);
}

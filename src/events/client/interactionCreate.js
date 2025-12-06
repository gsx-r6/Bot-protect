const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        try {
            if (interaction.isModalSubmit()) {
                return handleModalSubmit(interaction, client);
            }

            if (!interaction.isButton()) return;

            const customId = interaction.customId || '';

            if (customId === 'nami_ticket_create') {
                return showTicketModal(interaction, client);
            }

            if (customId === 'nami_ticket_list') {
                return showUserTickets(interaction, client);
            }

            if (customId === 'nami_ticket_close') {
                return closeTicket(interaction, client);
            }

            if (customId === 'nami_ticket_close_confirm') {
                return confirmCloseTicket(interaction, client);
            }

            if (customId === 'nami_ticket_close_cancel') {
                return cancelCloseTicket(interaction, client);
            }

            if (customId === 'nami_ticket_claim') {
                return claimTicket(interaction, client);
            }

            if (customId === 'nami_ticket_add') {
                return showAddUserModal(interaction, client);
            }

            if (customId === 'nami_ticket_transcript') {
                return generateTranscript(interaction, client);
            }

            if (customId.startsWith('mute_')) {
                return handleMutePanel(interaction, client, customId);
            }

            if (customId.startsWith('nami_profile_delete:')) {
                return handleProfileDelete(interaction, client, customId);
            }

        } catch (err) {
            client.logger.error('Error in interactionCreate event: ' + (err.stack || err.message));
            try { 
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'Une erreur est survenue.' });
                } else {
                    await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
                }
            } catch (_) { }
        }
    }
};

async function showTicketModal(interaction, client) {
    const modal = new ModalBuilder()
        .setCustomId('nami_ticket_modal')
        .setTitle('Créer un ticket');

    const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel('Sujet du ticket')
        .setPlaceholder('Décrivez brièvement votre problème...')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Description détaillée')
        .setPlaceholder('Expliquez votre problème en détail...')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
}

async function handleModalSubmit(interaction, client) {
    if (interaction.customId === 'nami_ticket_modal') {
        return createTicketFromModal(interaction, client);
    }

    if (interaction.customId === 'nami_ticket_add_modal') {
        return addUserToTicket(interaction, client);
    }
}

async function createTicketFromModal(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const owner = interaction.user;
    const subject = interaction.fields.getTextInputValue('ticket_subject');
    const description = interaction.fields.getTextInputValue('ticket_description') || '';

    const ticketConfig = db.getTicketConfig(guild.id) || {};
    const maxTickets = ticketConfig.max_tickets || 1;
    const openTickets = db.getOpenTicketsCount(guild.id, owner.id);

    if (openTickets >= maxTickets) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Limite atteinte')
            .setDescription(`Vous avez déjà **${openTickets}** ticket(s) ouvert(s).\nVeuillez fermer vos tickets existants avant d'en créer un nouveau.`);
        return interaction.editReply({ embeds: [embed] });
    }

    const ticketNumber = db.getTicketStats(guild.id).total + 1;
    const safeName = owner.username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}-${safeName}`;

    const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: owner.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    ];

    if (ticketConfig.staff_role) {
        const staffRole = guild.roles.cache.get(ticketConfig.staff_role);
        if (staffRole) {
            permissionOverwrites.push({
                id: staffRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ManageMessages]
            });
        }
    }

    const channelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites,
        topic: `Ticket de ${owner.tag} | Sujet: ${subject}`
    };

    if (ticketConfig.category_id) {
        const category = guild.channels.cache.get(ticketConfig.category_id);
        if (category && category.type === ChannelType.GuildCategory) {
            channelOptions.parent = category.id;
        }
    }

    const channel = await guild.channels.create(channelOptions);

    db.addTicket(guild.id, channel.id, owner.id, subject);

    const guildColor = ConfigService.getEmbedColor(guild.id);
    const welcomeMessage = (ticketConfig.welcome_message || 'Bienvenue {user} ! Un membre du staff va vous assister.')
        .replace(/{user}/g, owner.toString())
        .replace(/{username}/g, owner.username)
        .replace(/{server}/g, guild.name);

    const ticketEmbed = new EmbedBuilder()
        .setColor(ticketConfig.panel_color || guildColor || '#5865F2')
        .setTitle(`🎫 Ticket #${ticketNumber.toString().padStart(4, '0')}`)
        .setDescription(welcomeMessage)
        .addFields(
            { name: '👤 Créateur', value: `${owner}`, inline: true },
            { name: '📋 Sujet', value: subject, inline: true },
            { name: '🕐 Créé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: `ID: ${owner.id}` })
        .setTimestamp();

    if (description) {
        ticketEmbed.addFields({ name: '📝 Description', value: description, inline: false });
    }

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('nami_ticket_claim')
            .setLabel('Prendre en charge')
            .setEmoji('✋')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('nami_ticket_add')
            .setLabel('Ajouter membre')
            .setEmoji('➕')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('nami_ticket_transcript')
            .setLabel('Transcript')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('nami_ticket_close')
            .setLabel('Fermer')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
    );

    const staffMention = ticketConfig.staff_role ? `<@&${ticketConfig.staff_role}>` : '';
    await channel.send({ content: `${owner} ${staffMention}`, embeds: [ticketEmbed], components: [actionRow] });

    if (ticketConfig.log_channel) {
        await logTicketEvent(client, guild, ticketConfig.log_channel, 'create', {
            ticket: channel,
            user: owner,
            subject: subject
        });
    }

    const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Ticket créé')
        .setDescription(`Votre ticket a été créé: ${channel}\n\n**Sujet:** ${subject}`);

    await interaction.editReply({ embeds: [successEmbed] });
    client.logger.command(`TICKET created: #${ticketNumber} by ${owner.tag} in ${guild.name}`);
}

async function showUserTickets(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const userTickets = db.getOpenTicketsByUser(interaction.guild.id, interaction.user.id);
    
    if (userTickets.length === 0) {
        return interaction.editReply({ content: '📭 Vous n\'avez aucun ticket ouvert.' });
    }

    const ticketList = userTickets.map((t, i) => {
        const channel = interaction.guild.channels.cache.get(t.channel);
        const created = new Date(t.created_at);
        return `**${i + 1}.** ${channel ? channel.toString() : 'Canal supprimé'}\n└ Sujet: ${t.topic || 'Non spécifié'} • <t:${Math.floor(created.getTime() / 1000)}:R>`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
        .setColor(ConfigService.getEmbedColor(interaction.guild.id))
        .setTitle('📋 Vos tickets ouverts')
        .setDescription(ticketList)
        .setFooter({ text: `${userTickets.length} ticket(s) ouvert(s)` });

    await interaction.editReply({ embeds: [embed] });
}

async function closeTicket(interaction, client) {
    const ticket = db.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
        return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
    }

    const ticketConfig = db.getTicketConfig(interaction.guild.id) || {};
    const isOwner = interaction.user.id === ticket.owner;
    const isStaff = ticketConfig.staff_role && interaction.member.roles.cache.has(ticketConfig.staff_role);
    const canManage = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!isOwner && !isStaff && !canManage) {
        return interaction.reply({ content: '❌ Vous n\'avez pas la permission de fermer ce ticket.', ephemeral: true });
    }

    const confirmEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('⚠️ Confirmer la fermeture')
        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?\nCette action supprimera le salon.');

    const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('nami_ticket_close_confirm')
            .setLabel('Confirmer')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('nami_ticket_close_cancel')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });
}

async function confirmCloseTicket(interaction, client) {
    await interaction.deferUpdate();

    const ticket = db.getTicketByChannel(interaction.channel.id);
    if (!ticket) return;

    const ticketConfig = db.getTicketConfig(interaction.guild.id) || {};

    if (ticketConfig.transcript_enabled && ticketConfig.log_channel) {
        await generateAndSendTranscript(interaction, client, ticket, ticketConfig);
    }

    db.closeTicket(interaction.channel.id, interaction.user.id);

    if (ticketConfig.log_channel) {
        await logTicketEvent(client, interaction.guild, ticketConfig.log_channel, 'close', {
            ticket: interaction.channel,
            user: interaction.user,
            owner: ticket.owner,
            claimedBy: ticket.claimed_by
        });
    }

    const closingEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔒 Ticket fermé')
        .setDescription('Ce ticket va être supprimé dans 5 secondes...');

    await interaction.channel.send({ embeds: [closingEmbed] });

    setTimeout(async () => {
        try {
            await interaction.channel.delete('Ticket fermé');
        } catch (e) {
            client.logger.error('Error deleting ticket channel: ' + (e.stack || e.message));
        }
    }, 5000);

    client.logger.command(`TICKET closed by ${interaction.user.tag}`);
}

async function cancelCloseTicket(interaction, client) {
    await interaction.update({ content: '❌ Fermeture annulée.', embeds: [], components: [] });
}

async function claimTicket(interaction, client) {
    const ticket = db.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
        return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
    }

    const ticketConfig = db.getTicketConfig(interaction.guild.id) || {};
    const isStaff = ticketConfig.staff_role && interaction.member.roles.cache.has(ticketConfig.staff_role);
    const canManage = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!isStaff && !canManage) {
        return interaction.reply({ content: '❌ Seul le staff peut prendre en charge un ticket.', ephemeral: true });
    }

    if (ticket.claimed_by) {
        const claimer = await interaction.guild.members.fetch(ticket.claimed_by).catch(() => null);
        return interaction.reply({ 
            content: `❌ Ce ticket est déjà pris en charge par ${claimer ? claimer.toString() : 'un membre du staff'}.`, 
            ephemeral: true 
        });
    }

    db.claimTicket(interaction.channel.id, interaction.user.id);

    const claimEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`✋ **${interaction.user.tag}** a pris en charge ce ticket.`);

    await interaction.reply({ embeds: [claimEmbed] });

    await interaction.channel.setTopic(`Ticket de <@${ticket.owner}> | Pris en charge par ${interaction.user.tag}`);

    client.logger.command(`TICKET claimed by ${interaction.user.tag}`);
}

async function showAddUserModal(interaction, client) {
    const ticketConfig = db.getTicketConfig(interaction.guild.id) || {};
    const isStaff = ticketConfig.staff_role && interaction.member.roles.cache.has(ticketConfig.staff_role);
    const canManage = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!isStaff && !canManage) {
        return interaction.reply({ content: '❌ Seul le staff peut ajouter des membres au ticket.', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId('nami_ticket_add_modal')
        .setTitle('Ajouter un membre');

    const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID du membre à ajouter')
        .setPlaceholder('Entrez l\'ID Discord du membre...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(userInput));

    await interaction.showModal(modal);
}

async function addUserToTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
        return interaction.editReply({ content: '❌ Membre introuvable. Vérifiez l\'ID.' });
    }

    await interaction.channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
    });

    const addEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`➕ **${member.user.tag}** a été ajouté au ticket par ${interaction.user}.`);

    await interaction.channel.send({ embeds: [addEmbed] });
    await interaction.editReply({ content: `✅ ${member} a été ajouté au ticket.` });

    client.logger.command(`TICKET: ${member.user.tag} added by ${interaction.user.tag}`);
}

async function generateTranscript(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const ticket = db.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
        return interaction.editReply({ content: '❌ Ce salon n\'est pas un ticket.' });
    }

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();

    let transcript = `=== TRANSCRIPT DU TICKET ===\n`;
    transcript += `Serveur: ${interaction.guild.name}\n`;
    transcript += `Canal: #${interaction.channel.name}\n`;
    transcript += `Date: ${new Date().toLocaleString('fr-FR')}\n`;
    transcript += `Messages: ${sorted.length}\n`;
    transcript += `${'='.repeat(30)}\n\n`;

    sorted.forEach(msg => {
        const timestamp = msg.createdAt.toLocaleString('fr-FR');
        transcript += `[${timestamp}] ${msg.author.tag}:\n`;
        if (msg.content) transcript += `${msg.content}\n`;
        if (msg.attachments.size > 0) {
            transcript += `[Pièces jointes: ${msg.attachments.map(a => a.url).join(', ')}]\n`;
        }
        if (msg.embeds.length > 0) {
            transcript += `[${msg.embeds.length} embed(s)]\n`;
        }
        transcript += '\n';
    });

    const buffer = Buffer.from(transcript, 'utf-8');

    await interaction.editReply({
        content: '📝 Voici le transcript du ticket:',
        files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
    });

    client.logger.command(`TICKET transcript generated by ${interaction.user.tag}`);
}

async function generateAndSendTranscript(interaction, client, ticket, ticketConfig) {
    try {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted = [...messages.values()].reverse();

        let transcript = `=== TRANSCRIPT DU TICKET ===\n`;
        transcript += `Serveur: ${interaction.guild.name}\n`;
        transcript += `Canal: #${interaction.channel.name}\n`;
        transcript += `Créateur: <@${ticket.owner}>\n`;
        transcript += `Fermé par: ${interaction.user.tag}\n`;
        transcript += `Date de fermeture: ${new Date().toLocaleString('fr-FR')}\n`;
        transcript += `Messages: ${sorted.length}\n`;
        transcript += `${'='.repeat(30)}\n\n`;

        sorted.forEach(msg => {
            const timestamp = msg.createdAt.toLocaleString('fr-FR');
            transcript += `[${timestamp}] ${msg.author.tag}:\n`;
            if (msg.content) transcript += `${msg.content}\n`;
            if (msg.attachments.size > 0) {
                transcript += `[Pièces jointes: ${msg.attachments.map(a => a.url).join(', ')}]\n`;
            }
            transcript += '\n';
        });

        const buffer = Buffer.from(transcript, 'utf-8');
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.log_channel);

        if (logChannel) {
            const transcriptEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📝 Transcript de ticket')
                .setDescription(`**Canal:** #${interaction.channel.name}\n**Créateur:** <@${ticket.owner}>\n**Fermé par:** ${interaction.user}`)
                .setTimestamp();

            await logChannel.send({
                embeds: [transcriptEmbed],
                files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
            });
        }
    } catch (err) {
        client.logger.error('Error generating transcript: ' + err.message);
    }
}

async function logTicketEvent(client, guild, logChannelId, eventType, data) {
    try {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let embed;

        switch (eventType) {
            case 'create':
                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎫 Nouveau Ticket')
                    .addFields(
                        { name: 'Canal', value: data.ticket.toString(), inline: true },
                        { name: 'Créateur', value: data.user.toString(), inline: true },
                        { name: 'Sujet', value: data.subject || 'Non spécifié', inline: false }
                    )
                    .setFooter({ text: `ID: ${data.user.id}` })
                    .setTimestamp();
                break;

            case 'close':
                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔒 Ticket Fermé')
                    .addFields(
                        { name: 'Canal', value: `#${data.ticket.name}`, inline: true },
                        { name: 'Fermé par', value: data.user.toString(), inline: true },
                        { name: 'Créateur', value: `<@${data.owner}>`, inline: true }
                    )
                    .setTimestamp();
                
                if (data.claimedBy) {
                    embed.addFields({ name: 'Pris en charge par', value: `<@${data.claimedBy}>`, inline: true });
                }
                break;
        }

        if (embed) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        client.logger.error('Error logging ticket event: ' + err.message);
    }
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

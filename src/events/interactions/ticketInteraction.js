const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require('discord.js');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');
const transcriptHelper = require('../../utils/transcriptHelper');
const logger = require('../../utils/logger');

// Handler principal pour toutes les interactions Tickets UHQ
module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        // Ne traiter que les interactions liées aux tickets
        if (interaction.user.bot) return;

        const customId = interaction.customId || '';

        // 1. BOUTONS
        if (interaction.isButton()) {
            if (customId === 'nami_ticket_create') return showTicketModal(interaction);
            if (customId === 'nami_ticket_close') return closeTicketRequest(interaction);
            if (customId === 'nami_ticket_close_confirm') return confirmCloseTicket(interaction, client);
            if (customId === 'nami_ticket_close_cancel') return interaction.update({ content: '❌ Fermeture annulée.', embeds: [], components: [] });
            if (customId === 'nami_ticket_claim') return claimTicket(interaction);
            if (customId === 'nami_ticket_transcript') return sendTranscript(interaction, client, false);
            if (customId === 'nami_ticket_add') return showAddUserModal(interaction);
        }

        // 2. MODALS
        if (interaction.isModalSubmit()) {
            if (customId === 'nami_ticket_modal') return createTicket(interaction, client);
            if (customId === 'nami_ticket_add_modal') return addUserToTicket(interaction);
        }
    }
};

// --- FONCTIONS LOGIQUES ---

async function showTicketModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('nami_ticket_modal')
        .setTitle('Ouvrir un Ticket');

    const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel('Sujet')
        .setPlaceholder('Ex: Problème de connexion, Partenariat...')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Description')
        .setPlaceholder('Détaillez votre demande ici...')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
}

async function createTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const owner = interaction.user;
    const subject = interaction.fields.getTextInputValue('ticket_subject');
    const description = interaction.fields.getTextInputValue('ticket_description');

    // Vérification Limite Tickets
    const ticketConfig = db.getTicketConfig(guild.id) || {};
    const maxTickets = ticketConfig.max_tickets || 1;
    const openTickets = db.getOpenTicketsCount(guild.id, owner.id);

    if (openTickets >= maxTickets) {
        return interaction.editReply({
            content: `❌ Vous avez déjà **${openTickets}** ticket(s) ouvert(s). Fermez-en un pour continuer.`
        });
    }

    // Création Salon
    const ticketNumber = (db.getTicketStats(guild.id).total || 0) + 1;
    const channelName = `ticket-${ticketNumber}`;

    // Permissions de base
    const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: owner.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
    ];

    // Permission Staff
    if (ticketConfig.staff_role) {
        overwrites.push({ id: ticketConfig.staff_role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    }

    const parent = ticketConfig.category_id && guild.channels.cache.get(ticketConfig.category_id)?.type === ChannelType.GuildCategory
        ? ticketConfig.category_id
        : null;

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parent,
        permissionOverwrites: overwrites,
        topic: `Ticket #${ticketNumber} de ${owner.tag} | ${subject}`
    });

    // Enregistrement DB
    db.addTicket(guild.id, channel.id, owner.id, subject);

    // Message de Bienvenue (Embed UHQ)
    const embed = new EmbedBuilder()
        .setColor(ticketConfig.panel_color || '#5865F2')
        .setTitle(`🎫 Ticket #${ticketNumber} — ${subject}`)
        .setDescription(`Bonjour ${owner}, un membre du staff va prendre en charge votre demande.\n\n**Votre Message :**\n${description}`)
        .addFields(
            { name: '👤 Utilisateur', value: `${owner}`, inline: true },
            { name: '🛡️ Staff', value: ticketConfig.staff_role ? `<@&${ticketConfig.staff_role}>` : 'Non assigné', inline: true }
        )
        .setThumbnail(owner.displayAvatarURL())
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nami_ticket_claim').setLabel('Prendre en charge').setEmoji('✋').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('nami_ticket_close').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('nami_ticket_transcript').setLabel('Transcript').setEmoji('📝').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('nami_ticket_add').setLabel('Ajouter').setEmoji('➕').setStyle(ButtonStyle.Secondary)
    );

    // Mention Staff
    const mention = ticketConfig.staff_role ? `<@&${ticketConfig.staff_role}>` : '';
    await channel.send({ content: `${owner} ${mention}`, embeds: [embed], components: [row] });

    await interaction.editReply({ content: `✅ Ticket créé : ${channel}` });
}

async function closeTicketRequest(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setDescription('❓ **Êtes-vous sûr de vouloir fermer ce ticket ?**\nCette action est irréversible.');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nami_ticket_close_confirm').setLabel('Oui, fermer').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('nami_ticket_close_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function confirmCloseTicket(interaction, client) {
    await interaction.deferUpdate(); // Empêcher timeout

    const channel = interaction.channel;
    const ticket = db.getTicketByChannel(channel.id);
    const ticketConfig = db.getTicketConfig(interaction.guild.id);

    // 1. Générer Transcript Automatique si activé
    if (ticketConfig?.log_channel) {
        await sendTranscript(interaction, client, true);
    }

    // 2. Fermer DB
    if (ticket) db.closeTicket(channel.id, interaction.user.id);

    // 3. Delete Channel
    await channel.send({
        embeds: [new EmbedBuilder().setColor('#FF0000').setTitle('🔒 Ticket Fermé').setDescription('Suppression dans 5 secondes...')]
    });

    setTimeout(() => channel.delete().catch(() => { }), 5000);
}

async function claimTicket(interaction) {
    const ticket = db.getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ Erreur ticket DB.', ephemeral: true });
    if (ticket.claimed_by) return interaction.reply({ content: `❌ Déjà pris en charge par <@${ticket.claimed_by}>`, ephemeral: true });

    db.claimTicket(interaction.channel.id, interaction.user.id);

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`✅ **${interaction.user.tag}** a pris en charge ce ticket.`);

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: 'Pris en charge !', ephemeral: true });

    // Mettre à jour le topic
    const oldTopic = interaction.channel.topic || '';
    interaction.channel.setTopic(`${oldTopic} | STAFF: ${interaction.user.tag}`);
}

async function sendTranscript(interaction, client, isAuto = false) {
    if (!isAuto) await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const attachment = await transcriptHelper.generateHTMLTranscript(interaction.channel, messages, interaction.guild);

    if (isAuto) {
        // Envoi dans les logs
        const config = db.getTicketConfig(interaction.guild.id);
        const logChannel = interaction.guild.channels.cache.get(config?.log_channel);
        if (logChannel) {
            await logChannel.send({
                content: `📝 **Transcript Ticket** fermé par ${interaction.user.tag}`,
                files: [attachment]
            });
        }
    } else {
        // Envoi en privé (Ephemeral)
        await interaction.editReply({
            content: '📄 Voici le transcript HTML :',
            files: [attachment]
        });
    }
}

async function showAddUserModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('nami_ticket_add_modal')
        .setTitle('Ajouter un membre');

    const input = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID Utilisateur')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function addUserToTicket(interaction) {
    const userId = interaction.fields.getTextInputValue('user_id');
    try {
        const member = await interaction.guild.members.fetch(userId);
        await interaction.channel.permissionOverwrites.edit(member, {
            ViewChannel: true,
            SendMessages: true
        });
        interaction.reply({ content: `✅ ${member} ajouté au ticket.` });
    } catch (e) {
        interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    }
}

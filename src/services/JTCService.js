const db = require('../database/database');
const {
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const logger = require('../utils/logger');

class JTCService {
    constructor() {
        this.client = null;
        // Lazy init DB table
        db.db.prepare(`CREATE TABLE IF NOT EXISTS jtc_config (
            guild_id TEXT PRIMARY KEY,
            category_id TEXT,
            master_channel_id TEXT
        )`).run();

        // Table pour suivre les salons temporaires actifs (pour éviter des les perdre au reboot)
        db.db.prepare(`CREATE TABLE IF NOT EXISTS temp_channels (
            channel_id TEXT PRIMARY KEY,
            owner_id TEXT,
            guild_id TEXT,
            created_at TEXT
        )`).run();
    }

    setMasterChannel(guildId, masterId, categoryId) {
        db.db.prepare(`INSERT OR REPLACE INTO jtc_config (guild_id, master_channel_id, category_id) VALUES (?, ?, ?)`).run(guildId, masterId, categoryId);
    }

    getConfig(guildId) {
        return db.db.prepare(`SELECT * FROM jtc_config WHERE guild_id = ?`).get(guildId);
    }

    async handleVoiceUpdate(oldState, newState) {
        const guild = newState.guild;
        const config = this.getConfig(guild.id);
        if (!config) return;

        // 1. REJOINDRE LE MASTER CHANNEL -> CRÉER
        if (newState.channelId === config.master_channel_id) {
            await this.createTempChannel(newState.member, config.category_id);
        }

        // 2. QUITTER UN TEMP CHANNEL -> SUPPRIMER SI VIDE
        if (oldState.channelId) {
            const isTemp = db.db.prepare(`SELECT * FROM temp_channels WHERE channel_id = ?`).get(oldState.channelId);
            if (isTemp) {
                const channel = oldState.channel;
                if (channel && channel.members.size === 0) {
                    try {
                        await channel.delete();
                        db.db.prepare(`DELETE FROM temp_channels WHERE channel_id = ?`).run(channel.id);
                        logger.info(`[JTC] Salon temporaire supprimé: ${channel.name}`);
                    } catch (e) {
                        // Ignore (déjà supprimé ?)
                    }
                }
            }
        }
    }

    async createTempChannel(member, categoryId) {
        try {
            const guild = member.guild;

            // Créer le salon
            const channelName = `Salon de ${member.user.username}`;
            const tempChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone
                        allow: [PermissionFlagsBits.Connect],
                    },
                    {
                        id: member.id, // Owner
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
                    },
                ],
            });

            // Déplacer le membre
            await member.voice.setChannel(tempChannel);

            // Enregistrer en DB
            db.db.prepare(`INSERT INTO temp_channels (channel_id, owner_id, guild_id, created_at) VALUES (?, ?, ?, ?)`).run(tempChannel.id, member.id, guild.id, new Date().toISOString());

            // Envoyer l'INTERFACE DE CONTRÔLE (Text-in-Voice)
            await this.sendControlPanel(tempChannel, member);

        } catch (e) {
            logger.error(`[JTC] Erreur création salon: ${e.message}`);
        }
    }

    async sendControlPanel(channel, owner) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎛️ Interface de Contrôle Vocal')
                .setDescription(`Bienvenue dans votre salon temporaire **${owner.user.username}**.\nUtilisez les boutons ci-dessous pour gérer votre salon.`)
                .addFields(
                    { name: '👑 Propriétaire', value: `${owner}`, inline: true },
                    { name: '🔒 Visibilité', value: 'Public', inline: true }
                )
                .setFooter({ text: 'Ce salon sera supprimé quand il sera vide.' });

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('jtc_lock').setEmoji('🔒').setLabel('Verrouiller').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('jtc_unlock').setEmoji('🔓').setLabel('Déverrouiller').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('jtc_hide').setEmoji('👁️').setLabel('Masquer').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('jtc_show').setEmoji('👀').setLabel('Afficher').setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('jtc_rename').setEmoji('✏️').setLabel('Nom').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('jtc_limit').setEmoji('👥').setLabel('Limite').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('jtc_kick').setEmoji('👢').setLabel('Kick').setStyle(ButtonStyle.Danger)
                );

            await channel.send({ content: `${owner}`, embeds: [embed], components: [row1, row2] });
        } catch (e) {
            logger.error('[JTC] Impossible d\'envoyer le panel:', e);
        }
    }
}

module.exports = new JTCService();

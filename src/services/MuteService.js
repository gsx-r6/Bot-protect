const { EmbedBuilder, PermissionFlagsBits, OverwriteType } = require('discord.js');
const db = require('../database/database');
const logger = require('../utils/logger');

class MuteService {
    constructor(client) {
        this.client = client;
        this.checkInterval = 30000; // 30 seconds
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        // Start expiration check loop
        setInterval(() => this.checkExpirations(), this.checkInterval);

        this.isInitialized = true;
        logger.info('MuteService initialized.');
    }

    /**
     * Get or create the Muted role for a guild
     */
    async getOrCreateMuteRole(guild) {
        const config = db.getGuildConfig(guild.id);
        let roleId = config?.mute_role_id;
        let role = roleId ? guild.roles.cache.get(roleId) : null;

        // Verify role still exists in Discord
        if (!role && roleId) {
            // Role was deleted but still in DB, clear it
            db.setGuildConfig(guild.id, 'mute_role_id', null);
            roleId = null;
        }

        if (!role) {
            // Find an existing one by name if not in DB
            role = guild.roles.cache.find(r => r.name === 'Muted');

            if (!role) {
                try {
                    role = await guild.roles.create({
                        name: 'Muted',
                        color: '#34383D',
                        reason: '[🛡️ UHQ SECURITY] Création automatique du rôle Muted',
                        permissions: []
                    });

                    // Position it as high as possible (under the bot's role)
                    const botMember = await guild.members.fetchMe();
                    await role.setPosition(botMember.roles.highest.position - 1);
                } catch (error) {
                    logger.error(`Failed to create Muted role in ${guild.name}:`, error);
                    return null;
                }
            }

            // Save to DB
            db.setGuildConfig(guild.id, 'mute_role_id', role.id);
        }

        return role;
    }

    /**
     * Set up channel permissions for the Muted role
     */
    async setupChannelPermissions(channel, muteRole) {
        if (channel.isThread()) return;

        // Don't modify ticket channels (if they have 'ticket' in name or are in a specific category)
        if (channel.name.toLowerCase().includes('ticket') ||
            channel.parent?.name.toLowerCase().includes('ticket')) {
            return;
        }

        try {
            await channel.permissionOverwrites.edit(muteRole, {
                [PermissionFlagsBits.SendMessages]: false,
                [PermissionFlagsBits.AddReactions]: false,
                [PermissionFlagsBits.Speak]: false,
                [PermissionFlagsBits.Connect]: false,
                [PermissionFlagsBits.CreatePublicThreads]: false,
                [PermissionFlagsBits.CreatePrivateThreads]: false,
                [PermissionFlagsBits.SendMessagesInThreads]: false
            }, { reason: '[🛡️ UHQ SECURITY] Mise à jour des permissions pour Muted' });
        } catch (error) {
            logger.warn(`Could not update permissions for channel ${channel.name} in ${channel.guild.name}: ${error.message}`);
        }
    }

    /**
     * Apply a mute to a member
     */
    async mute(member, duration, reason, moderator) {
        const muteRole = await this.getOrCreateMuteRole(member.guild);
        if (!muteRole) return { success: false, error: 'Cannot create/find Muted role.' };

        try {
            // Apply role
            await member.roles.add(muteRole, `[🛡️ UHQ MODERATION] ${reason} — par ${moderator.tag}`);

            // Save to persistent mutes if it's a temp mute
            const expiresAt = duration > 0 ? Date.now() + duration : 0;
            db.addPersistentMute(member.guild.id, member.id, expiresAt);

            // Sync channel permissions (async, non-blocking for the response)
            this.syncGuildPermissions(member.guild, muteRole);

            return { success: true, expiresAt };
        } catch (error) {
            logger.error(`Error muting member ${member.user.tag}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unmute a member
     */
    async unmute(member, reason, moderator = null) {
        const muteRole = await this.getOrCreateMuteRole(member.guild);
        if (!muteRole) return { success: false, error: 'Muted role not found.' };

        try {
            await member.roles.remove(muteRole, `[🛡️ UHQ MODERATION] ${reason}${moderator ? ` — par ${moderator.tag}` : ''}`);
            db.removePersistentMute(member.guild.id, member.id);
            return { success: true };
        } catch (error) {
            logger.error(`Error unmuting member ${member.user.tag}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Background task to check for expired mutes
     */
    async checkExpirations() {
        const mutes = db.getAllPersistentMutes();
        const now = Date.now();

        for (const muteData of mutes) {
            if (muteData.expires_at > 0 && muteData.expires_at <= now) {
                const guild = this.client.guilds.cache.get(muteData.guild_id);
                if (!guild) continue;

                try {
                    const member = await guild.members.fetch(muteData.user_id).catch(() => null);
                    if (member) {
                        await this.unmute(member, 'Mute expiré (Auto-unmute)');
                        logger.info(`Auto-unmuted ${member.user.tag} in ${guild.name}`);
                    } else {
                        // User not in guild, just remove from DB
                        db.removePersistentMute(guild.id, muteData.user_id);
                    }
                } catch (error) {
                    logger.error(`Failed auto-unmute for ${muteData.user_id} in ${guild.id}:`, error);
                }
            }
        }
    }

    /**
     * Synchronize permissions for all channels in a guild
     */
    async syncGuildPermissions(guild, muteRole) {
        const channels = guild.channels.cache;
        for (const channel of channels.values()) {
            await this.setupChannelPermissions(channel, muteRole);
        }
    }
}

module.exports = MuteService;

const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require('discord.js');

class RoleProtector {
    constructor(client) {
        this.client = client;
        this.protectedRoles = new Map();
        this.roleSnapshots = new Map();
    }

    init() {
        this.client.on('roleUpdate', (oldRole, newRole) => this.onRoleUpdate(oldRole, newRole));
        this.client.on('roleDelete', (role) => this.onRoleDelete(role));
        logger.info('RoleProtector initialized with enforcement enabled');
    }

    async onRoleUpdate(oldRole, newRole) {
        const guildProtected = this.protectedRoles.get(oldRole.guild.id) || new Set();
        if (!guildProtected.has(oldRole.id)) return;

        const dangerousPermsAdded = this.checkDangerousPermissions(oldRole, newRole);

        if (dangerousPermsAdded.length > 0) {
            try {
                const auditLogs = await oldRole.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleUpdate,
                    limit: 1
                });

                const logEntry = auditLogs.entries.first();
                const executor = logEntry?.executor;

                if (executor && executor.id === oldRole.guild.ownerId) return;
                if (executor && executor.id === this.client.user.id) return;

                await newRole.setPermissions(oldRole.permissions, 'RoleProtector: Restauration des permissions');

                logger.warn(`[RoleProtector] Reverted dangerous permission change on role ${oldRole.name}`);

                const logChannels = db.getLoggerChannels(oldRole.guild.id);
                if (logChannels?.automod_log) {
                    const logChannel = oldRole.guild.channels.cache.get(logChannels.automod_log);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#FF6600')
                            .setTitle('🛡️ Rôle Protégé - Permissions Restaurées')
                            .setDescription(`Les permissions du rôle **${oldRole.name}** ont été restaurées`)
                            .addFields(
                                { name: '🎭 Rôle', value: oldRole.name, inline: true },
                                { name: '⚠️ Permissions bloquées', value: dangerousPermsAdded.join(', '), inline: true },
                                { name: '👤 Modifié par', value: executor ? executor.tag : 'Inconnu', inline: true }
                            )
                            .setTimestamp();

                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                logger.error('[RoleProtector] Failed to revert role permissions:', err.message);
            }
        }
    }

    async onRoleDelete(role) {
        const guildProtected = this.protectedRoles.get(role.guild.id) || new Set();
        if (!guildProtected.has(role.id)) return;

        const snapshot = this.roleSnapshots.get(role.id);
        if (!snapshot) {
            logger.warn(`[RoleProtector] Protected role ${role.name} deleted but no snapshot available`);
            return;
        }

        try {
            const auditLogs = await role.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
                limit: 1
            });

            const logEntry = auditLogs.entries.first();
            const executor = logEntry?.executor;

            if (executor && executor.id === role.guild.ownerId) return;

            const newRole = await role.guild.roles.create({
                name: snapshot.name,
                color: snapshot.color,
                permissions: snapshot.permissions,
                hoist: snapshot.hoist,
                mentionable: snapshot.mentionable,
                reason: 'RoleProtector: Restauration du rôle protégé supprimé'
            });

            logger.warn(`[RoleProtector] Recreated deleted protected role ${snapshot.name}`);

            guildProtected.delete(role.id);
            guildProtected.add(newRole.id);
            this.roleSnapshots.delete(role.id);
            this.takeSnapshot(newRole);

            const logChannels = db.getLoggerChannels(role.guild.id);
            if (logChannels?.automod_log) {
                const logChannel = role.guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🛡️ Rôle Protégé Restauré')
                        .setDescription(`Le rôle **${snapshot.name}** a été recréé après suppression non autorisée`)
                        .addFields(
                            { name: '👤 Supprimé par', value: executor ? executor.tag : 'Inconnu', inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }
        } catch (err) {
            logger.error('[RoleProtector] Failed to recreate deleted role:', err.message);
        }
    }

    checkDangerousPermissions(oldRole, newRole) {
        const dangerous = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageGuild,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers
        ];

        const added = [];
        for (const perm of dangerous) {
            if (!oldRole.permissions.has(perm) && newRole.permissions.has(perm)) {
                added.push(perm.toString());
            }
        }
        return added;
    }

    takeSnapshot(role) {
        this.roleSnapshots.set(role.id, {
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield,
            hoist: role.hoist,
            mentionable: role.mentionable
        });
    }

    addProtected(guildId, roleId, role) {
        if (!this.protectedRoles.has(guildId)) {
            this.protectedRoles.set(guildId, new Set());
        }
        this.protectedRoles.get(guildId).add(roleId);
        if (role) this.takeSnapshot(role);
        logger.info(`[RoleProtector] Added role ${roleId} to protected list`);
    }

    removeProtected(guildId, roleId) {
        const guildSet = this.protectedRoles.get(guildId);
        if (guildSet) {
            guildSet.delete(roleId);
            this.roleSnapshots.delete(roleId);
        }
        logger.info(`[RoleProtector] Removed role ${roleId} from protected list`);
    }
}

module.exports = RoleProtector;

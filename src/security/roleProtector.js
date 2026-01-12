const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require('discord.js');

class RoleProtector {
    constructor(client) {
        this.client = client;
        this.protectedRoles = new Map();
        this.roleSnapshots = new Map();
        this.checkInterval = null;
    }

    init() {
        this.client.on('roleUpdate', (oldRole, newRole) => this.onRoleUpdate(oldRole, newRole));
        this.client.on('roleDelete', (role) => this.onRoleDelete(role));

        // Initial Sync
        this.client.guilds.cache.forEach(async guild => {
            await this.syncProtectedRoles(guild);
        });

        // Periodic Integrity Check (every 5 mins)
        this.checkInterval = setInterval(() => this.runIntegrityCheck(), 5 * 60 * 1000);

        logger.info('RoleProtector initialized with enforcement, persistence and integrity checks enabled');
    }

    async syncProtectedRoles(guild) {
        if (!this.protectedRoles.has(guild.id)) {
            this.protectedRoles.set(guild.id, new Set());
        }
        const protectedSet = this.protectedRoles.get(guild.id);

        try {
            // Source 1: Guild Config (Autorole & Quarantine)
            const guildConfig = db.getGuildConfig(guild.id);
            if (guildConfig) {
                if (guildConfig.autorole_id) protectedSet.add(guildConfig.autorole_id);
                if (guildConfig.quarantine_role_id) protectedSet.add(guildConfig.quarantine_role_id);
            }

            // Source 2: Ticket Config (Staff Role)
            const ticketConfig = db.getTicketConfig(guild.id);
            if (ticketConfig && ticketConfig.staff_role) {
                protectedSet.add(ticketConfig.staff_role);
            }

            // Hydrate Snapshots for new roles
            for (const roleId of protectedSet) {
                if (!this.roleSnapshots.has(roleId)) {
                    // Try to load from DB first
                    const dbSnapshot = db.getRoleSnapshot(guild.id, roleId);
                    if (dbSnapshot) {
                        this.roleSnapshots.set(roleId, {
                            name: dbSnapshot.name,
                            color: dbSnapshot.color,
                            permissions: BigInt(dbSnapshot.permissions),
                            hoist: dbSnapshot.hoist === 1,
                            mentionable: dbSnapshot.mentionable === 1
                        });
                        logger.debug(`[RoleProtector] Loaded snapshot for ${dbSnapshot.name} from DB`);
                    } else {
                        // Fallback: take fresh snapshot from cache
                        const role = guild.roles.cache.get(roleId);
                        if (role) {
                            this.takeSnapshot(role);
                        }
                    }
                }
            }
        } catch (err) {
            logger.error(`[RoleProtector] Sync failed for guild ${guild.id}: ${err.message}`);
        }
    }

    async runIntegrityCheck() {
        logger.debug('[RoleProtector] Running integrity check...');
        for (const guild of this.client.guilds.cache.values()) {
            await this.syncProtectedRoles(guild);

            const protectedSet = this.protectedRoles.get(guild.id);
            if (!protectedSet) continue;

            for (const roleId of protectedSet) {
                const role = guild.roles.cache.get(roleId);

                // Case 1: Role Deleted (Not in cache)
                if (!role) {
                    // We need a pseudo-object to trigger restoration if we have a snapshot
                    if (this.roleSnapshots.has(roleId)) {
                        logger.warn(`[Integrity] Found deleted protected role ${roleId}, attempting restoration...`);
                        await this.onRoleDelete({ id: roleId, guild: guild, name: this.roleSnapshots.get(roleId).name });
                    }
                    continue;
                }

                // Case 2: Dangerous Permissions (Check logic)
                const dangerous = [
                    PermissionFlagsBits.Administrator,
                    PermissionFlagsBits.ManageGuild,
                    PermissionFlagsBits.ManageRoles,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.BanMembers,
                    PermissionFlagsBits.KickMembers
                ];

                // If it has a dangerous perm, revert it (mocking update event)
                const currentPerms = role.permissions;
                for (const perm of dangerous) {
                    if (currentPerms.has(perm)) {
                        // Simulate cleanup
                        await this.onRoleUpdate(role, role); // Self-call triggers check logic if implemented generic enough, or explicit fix:

                        // Note: onRoleUpdate expects oldRole/newRole diff. 
                        // Let's rely on explicit fix here for robustness
                        const snapshot = this.roleSnapshots.get(roleId);
                        if (snapshot && !new Set(snapshot.permissions).has(perm)) { // Simplified check
                            logger.warn(`[Integrity] Found dangerous perm on ${role.name}, reverting...`);
                            await role.setPermissions(snapshot.permissions, 'RoleProtector: Integrity Check Fix');
                        }
                    }
                }
            }
        }
    }

    async onRoleUpdate(oldRole, newRole) {
        const guildProtected = this.protectedRoles.get(oldRole.guild.id) || new Set();
        if (!guildProtected.has(oldRole.id)) return;

        const dangerousPermsAdded = this.checkDangerousPermissions(oldRole, newRole);

        if (dangerousPermsAdded.length > 0) {
            try {
                // ... (Audit Log logic remains similar, but simplified/hardened)
                const auditLogs = await oldRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(() => null);
                const logEntry = auditLogs?.entries.first();
                const executor = logEntry?.executor;

                if (executor && executor.id === oldRole.guild.ownerId) {
                    this.takeSnapshot(newRole); // Owner allowed -> Update snapshot
                    return;
                }
                if (executor && executor.id === this.client.user.id) return;

                await newRole.setPermissions(oldRole.permissions, 'RoleProtector: Restauration des permissions');

                // DM Owner Alert (Enhanced UX)
                const owner = await oldRole.guild.fetchOwner().catch(() => null);
                if (owner) {
                    owner.send(`⚠️ **Alerte Sécurité** : Tentative de modification critique sur le rôle protégé **${oldRole.name}** par ${executor ? executor.tag : 'Inconnu'}. Action annulée.`).catch(() => { });
                }

                logger.warn(`[RoleProtector] Reverted dangerous permission change on role ${oldRole.name}`);

                // Log Channel
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
                        logChannel.send({ embeds: [embed] }).catch(() => { });
                    }
                }

            } catch (err) {
                logger.error('[RoleProtector] Failed to revert role permissions:', err.message);
            }
        } else {
            // Safe update -> Update Snapshot
            this.takeSnapshot(newRole);
        }
    }

    async onRoleDelete(role) {
        const guildProtected = this.protectedRoles.get(role.guild.id) || new Set();
        if (!guildProtected.has(role.id)) return;

        const snapshot = this.roleSnapshots.get(role.id);
        if (!snapshot) {
            logger.warn(`[RoleProtector] Protected role ${role.name || role.id} deleted but no snapshot available`);
            return;
        }

        try {
            const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
            const logEntry = auditLogs?.entries.first();
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

            // DM Owner Alert
            const owner = await role.guild.fetchOwner().catch(() => null);
            if (owner) {
                owner.send(`🚨 **URGENT** : Le rôle protégé **${snapshot.name}** a été supprimé ! Je l'ai recréé automatiquement.`).catch(() => { });
            }

            // Update ID mapping in DB if necessary (e.g. for Quarantine Role)
            const guildConfig = db.getGuildConfig(role.guild.id);
            if (guildConfig.quarantine_role_id === role.id) db.setGuildConfig(role.guild.id, 'quarantine_role_id', newRole.id);
            if (guildConfig.autorole_id === role.id) db.setGuildConfig(role.guild.id, 'autorole_id', newRole.id);

            // Update internal state
            guildProtected.delete(role.id);
            guildProtected.add(newRole.id);

            // Important: Delete old snapshot from DB and Memory
            this.roleSnapshots.delete(role.id);
            db.deleteRoleSnapshot(role.guild.id, role.id);

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
                    logChannel.send({ embeds: [embed] }).catch(() => { });
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
        const snapshot = {
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield,
            hoist: role.hoist,
            mentionable: role.mentionable
        };

        this.roleSnapshots.set(role.id, snapshot);

        // Persistent Save
        db.saveRoleSnapshot(role.guild.id, role.id, snapshot);
        logger.debug(`[RoleProtector] Snapshot saved to DB for role ${role.name}`);
    }

    destroy() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }
}

module.exports = RoleProtector;

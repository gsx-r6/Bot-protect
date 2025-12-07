const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Service de backup et restore de serveur Discord
 */
class BackupService {
    constructor() {
        this.backupDir = path.join(process.cwd(), 'data', 'backups');
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Créer un backup complet du serveur
     */
    async createBackup(guild) {
        try {
            // Fetch guild data to ensure cache is populated
            await guild.fetch();
            await guild.roles.fetch();
            await guild.channels.fetch();
            await guild.emojis.fetch();

            const backup = {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL({ size: 1024 }),
                banner: guild.bannerURL({ size: 1024 }),
                description: guild.description,
                createdAt: Date.now(),
                roles: [],
                channels: [],
                emojis: [],
                categories: []
            };

            // Sauvegarder les rôles (sauf @everyone)
            for (const role of guild.roles.cache.values()) {
                if (role.name === '@everyone') continue;

                backup.roles.push({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable
                });
            }

            // Sauvegarder les catégories et salons
            for (const channel of guild.channels.cache.values()) {
                if (channel.type === 4) { // Category
                    backup.categories.push({
                        id: channel.id,
                        name: channel.name,
                        position: channel.position
                    });
                } else {
                    const channelData = {
                        id: channel.id,
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        parentId: channel.parentId,
                        topic: channel.topic || null,
                        nsfw: channel.nsfw || false,
                        rateLimitPerUser: channel.rateLimitPerUser || 0,
                        permissions: []
                    };

                    // Sauvegarder les permissions
                    for (const overwrite of channel.permissionOverwrites.cache.values()) {
                        channelData.permissions.push({
                            id: overwrite.id,
                            type: overwrite.type,
                            allow: overwrite.allow.bitfield.toString(),
                            deny: overwrite.deny.bitfield.toString()
                        });
                    }

                    backup.channels.push(channelData);
                }
            }

            // Sauvegarder les emojis
            for (const emoji of guild.emojis.cache.values()) {
                backup.emojis.push({
                    name: emoji.name,
                    url: emoji.url,
                    animated: emoji.animated
                });
            }

            // Sauvegarder dans un fichier
            const filename = `backup-${guild.id}-${Date.now()}.json`;
            const filepath = path.join(this.backupDir, filename);
            fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

            logger.info(`[Backup] Backup créé pour ${guild.name}: ${filename}`);

            // Nettoyer les anciens backups (garder les 7 derniers)
            this.cleanOldBackups(guild.id);

            return { success: true, filename, backup };

        } catch (err) {
            logger.error('[Backup] Erreur lors de la création:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Restaurer un serveur depuis un backup
     */
    async restoreBackup(guild, filename, options = {}) {
        try {
            const filepath = path.join(this.backupDir, filename);

            if (!fs.existsSync(filepath)) {
                return { success: false, error: 'Backup introuvable' };
            }

            const backup = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            const results = {
                roles: { created: 0, failed: 0 },
                channels: { created: 0, failed: 0 },
                emojis: { created: 0, failed: 0 }
            };

            // Restaurer les rôles
            if (options.restoreRoles !== false) {
                logger.info('[Restore] Restauration des rôles...');

                // Trier par position (du plus bas au plus haut)
                const sortedRoles = backup.roles.sort((a, b) => a.position - b.position);

                for (const roleData of sortedRoles) {
                    try {
                        await guild.roles.create({
                            name: roleData.name,
                            color: roleData.color,
                            hoist: roleData.hoist,
                            permissions: BigInt(roleData.permissions),
                            mentionable: roleData.mentionable,
                            reason: 'Restauration depuis backup'
                        });
                        results.roles.created++;
                    } catch (err) {
                        logger.error(`[Restore] Erreur rôle ${roleData.name}:`, err.message);
                        results.roles.failed++;
                    }
                }
            }

            // Restaurer les catégories d'abord
            if (options.restoreChannels !== false) {
                logger.info('[Restore] Restauration des catégories...');

                const categoryMap = new Map(); // oldId -> newId

                for (const catData of backup.categories) {
                    try {
                        const newCat = await guild.channels.create({
                            name: catData.name,
                            type: 4,
                            position: catData.position,
                            reason: 'Restauration depuis backup'
                        });
                        categoryMap.set(catData.id, newCat.id);
                        results.channels.created++;
                    } catch (err) {
                        logger.error(`[Restore] Erreur catégorie ${catData.name}:`, err.message);
                        results.channels.failed++;
                    }
                }

                // Restaurer les salons
                logger.info('[Restore] Restauration des salons...');

                for (const channelData of backup.channels) {
                    try {
                        const createData = {
                            name: channelData.name,
                            type: channelData.type,
                            position: channelData.position,
                            topic: channelData.topic,
                            nsfw: channelData.nsfw,
                            rateLimitPerUser: channelData.rateLimitPerUser,
                            reason: 'Restauration depuis backup'
                        };

                        // Mapper l'ancienne catégorie à la nouvelle
                        if (channelData.parentId && categoryMap.has(channelData.parentId)) {
                            createData.parent = categoryMap.get(channelData.parentId);
                        }

                        const newChannel = await guild.channels.create(createData);

                        // Restaurer les permissions
                        for (const perm of channelData.permissions) {
                            try {
                                await newChannel.permissionOverwrites.create(perm.id, {
                                    allow: BigInt(perm.allow),
                                    deny: BigInt(perm.deny)
                                });
                            } catch (e) {
                                // Ignore si le rôle/user n'existe plus
                            }
                        }

                        results.channels.created++;
                    } catch (err) {
                        logger.error(`[Restore] Erreur salon ${channelData.name}:`, err.message);
                        results.channels.failed++;
                    }
                }
            }

            // Restaurer les emojis
            if (options.restoreEmojis !== false) {
                logger.info('[Restore] Restauration des emojis...');

                for (const emojiData of backup.emojis) {
                    try {
                        await guild.emojis.create({
                            attachment: emojiData.url,
                            name: emojiData.name,
                            reason: 'Restauration depuis backup'
                        });
                        results.emojis.created++;
                    } catch (err) {
                        logger.error(`[Restore] Erreur emoji ${emojiData.name}:`, err.message);
                        results.emojis.failed++;
                    }
                }
            }

            logger.info(`[Restore] Restauration terminée:`, results);
            return { success: true, results };

        } catch (err) {
            logger.error('[Restore] Erreur lors de la restauration:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Lister les backups d'un serveur
     */
    listBackups(guildId) {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = files
                .filter(f => f.startsWith(`backup-${guildId}-`) && f.endsWith('.json'))
                .map(f => {
                    const filepath = path.join(this.backupDir, f);
                    const stats = fs.statSync(filepath);
                    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

                    return {
                        filename: f,
                        createdAt: data.createdAt,
                        size: stats.size,
                        roles: data.roles.length,
                        channels: data.channels.length,
                        emojis: data.emojis.length
                    };
                })
                .sort((a, b) => b.createdAt - a.createdAt);

            return backups;
        } catch (err) {
            logger.error('[Backup] Erreur lors du listing:', err);
            return [];
        }
    }

    /**
     * Supprimer un backup
     */
    deleteBackup(filename) {
        try {
            const filepath = path.join(this.backupDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                logger.info(`[Backup] Backup supprimé: ${filename}`);
                return true;
            }
            return false;
        } catch (err) {
            logger.error('[Backup] Erreur lors de la suppression:', err);
            return false;
        }
    }

    /**
     * Nettoyer les anciens backups (garder les 7 derniers)
     */
    cleanOldBackups(guildId) {
        try {
            const backups = this.listBackups(guildId);

            if (backups.length > 7) {
                const toDelete = backups.slice(7);
                for (const backup of toDelete) {
                    this.deleteBackup(backup.filename);
                }
                logger.info(`[Backup] ${toDelete.length} anciens backups supprimés`);
            }
        } catch (err) {
            logger.error('[Backup] Erreur lors du nettoyage:', err);
        }
    }
}

module.exports = new BackupService();

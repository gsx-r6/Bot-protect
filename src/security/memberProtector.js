const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');

class MemberProtector {
    constructor(client) {
        this.client = client;
        this.protected = new Set();
    }

    init() {
        logger.info('MemberProtector initialized (Stand-alone mode)');
    }

    async onMemberUpdate(oldMember, newMember) {
        if (!this.protected.has(newMember.id)) return;

        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (removedRoles.size === 0) return;

        try {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 1
            });

            const logEntry = auditLogs.entries.first();
            const executor = logEntry?.executor;

            if (executor && executor.id === newMember.guild.ownerId) return;
            if (executor && executor.id === this.client.user.id) return;

            for (const [roleId, role] of removedRoles) {
                await newMember.roles.add(role, 'MemberProtector: Restauration des rôles protégés');
            }

            logger.warn(`[MemberProtector] Restored ${removedRoles.size} roles for protected member ${newMember.user.tag}`);

            const logChannels = db.getLoggerChannels(newMember.guild.id);
            if (logChannels?.automod_log) {
                const logChannel = newMember.guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🛡️ Membre Protégé - Rôles Restaurés')
                        .setDescription(`Les rôles de ${newMember} ont été restaurés automatiquement`)
                        .addFields(
                            { name: '👤 Membre', value: `${newMember.user.tag}`, inline: true },
                            { name: '🎭 Rôles restaurés', value: removedRoles.map(r => r.name).join(', '), inline: true },
                            { name: '👤 Modifié par', value: executor ? executor.tag : 'Inconnu', inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }
        } catch (err) {
            logger.error('[MemberProtector] Failed to restore roles:', err.message);
        }
    }

    addProtected(id) {
        this.protected.add(id);
        logger.info(`[MemberProtector] Added ${id} to protected list`);
    }

    removeProtected(id) {
        this.protected.delete(id);
        logger.info(`[MemberProtector] Removed ${id} from protected list`);
    }

    isProtected(id) {
        return this.protected.has(id);
    }
}

module.exports = MemberProtector;

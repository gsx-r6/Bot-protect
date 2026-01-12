const Response = require('../utils/Response');
const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder } = require('discord.js');

class AntiRaid {
    constructor(client) {
        this.client = client;
        this.joins = new Map();
        this.raidMode = new Map();
        this.cleanupInterval = null;
    }

    async init() {
        this.client.on('guildMemberAdd', (member) => this.onJoin(member));
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);

        // Restore Raid State from DB
        const guilds = this.client.guilds.cache.map(g => g.id);
        for (const guildId of guilds) {
            const state = db.getRaidState(guildId);
            if (state && state.is_active) {
                const guild = this.client.guilds.cache.get(guildId);
                if (guild) {
                    logger.warn(`[AntiRaid] Restoring active RAID MODE for ${guild.name}`);
                    this.raidMode.set(guildId, true);
                    // Deactivate after remaining time (assuming 5 min default window, this is simple recovery)
                    setTimeout(() => this.deactivateRaidMode(guild), 5 * 60 * 1000);
                }
            }
        }

        logger.info('AntiRaid initialized with enforcement enabled and state stability');
    }

    async onJoin(member) {
        const guild = member.guild;
        const guildId = guild.id;
        const now = Date.now();

        const config = db.getAutomodConfig(guildId) || {};
        if (!config.antijoinraid) return;

        if (!this.joins.has(guildId)) this.joins.set(guildId, []);
        const arr = this.joins.get(guildId);
        arr.push({ time: now, memberId: member.id });

        // Dynamic Configuration
        const timeframe = config.antiraid_timeframe || 10000;
        const threshold = config.antiraid_threshold || 10;

        while (arr.length && now - arr[0].time > timeframe) arr.shift();

        if (arr.length >= threshold) {
            await this.activateRaidMode(guild, arr);
        }

        if (this.raidMode.get(guildId)) {
            await this.handleRaidMember(member);
        }
    }

    async activateRaidMode(guild, recentJoins) {
        const guildId = guild.id;

        if (this.raidMode.get(guildId)) return;

        this.raidMode.set(guildId, true);
        
        // PERSISTENCE: Save both the active state AND the list of suspected member IDs
        const memberIds = recentJoins.map(j => j.memberId);
        db.setRaidState(guildId, true, memberIds);

        logger.warn(`[AntiRaid] RAID DETECTED in ${guild.name}! ${recentJoins.length} joins`);

        // DM Owner
        try {
            const owner = await guild.fetchOwner();
            owner.send({ embeds: [Response.error(`🚨 **ALERTE SÉCURITÉ** : Raid détecté sur ${guild.name} ! Mode protection activé.`)] }).catch(() => { });
        } catch (e) { }

        for (const join of recentJoins) {
            try {
                const member = await guild.members.fetch(join.memberId).catch(() => null);
                if (member) {
                    await this.handleRaidMember(member);
                }
            } catch (e) { }
        }

        const logChannels = db.getLoggerChannels(guildId);
        if (logChannels?.automod_log) {
            const logChannel = guild.channels.cache.get(logChannels.automod_log);
            if (logChannel) {
                const embed = Response.error('🚨 RAID DÉTECTÉ!\nMode raid activé automatiquement')
                    .addFields(
                        { name: '📊 Joins détectés', value: `${recentJoins.length}`, inline: true },
                        { name: '⏱️ Fenêtre', value: `${db.getAutomodConfig(guildId)?.antiraid_timeframe || 10000}ms`, inline: true },
                        { name: '🛡️ Action', value: 'Nouveaux membres mis en quarantaine', inline: true }
                    );

                await logChannel.send({ embeds: [embed] });
            }
        }

        setTimeout(() => {
            this.deactivateRaidMode(guild);
        }, 5 * 60 * 1000);
    }

    async deactivateRaidMode(guild) {
        if (!this.raidMode.get(guild.id)) return;

        this.raidMode.set(guild.id, false);
        db.setRaidState(guild.id, false); // PERSISTENCE UPDATE
        logger.info(`[AntiRaid] Raid mode deactivated for ${guild.name}`);
    }

    async handleRaidMember(member) {
        try {
            const guild = member.guild;
            const guildConfig = db.getGuildConfig(guild.id);
            let quarantineRole = null;

            // 1. Try Configured ID
            if (guildConfig && guildConfig.quarantine_role_id) {
                quarantineRole = guild.roles.cache.get(guildConfig.quarantine_role_id);
            }

            // 2. Fallback: Find by Name
            if (!quarantineRole) {
                quarantineRole = guild.roles.cache.find(r => r.name === '🔒 Quarantine');

                // If found by name but ID was missing or wrong, update DB
                if (quarantineRole) {
                    db.setGuildConfig(guild.id, 'quarantine_role_id', quarantineRole.id);
                }
            }

            // 3. Last Resort: Create Role
            if (!quarantineRole) {
                quarantineRole = await guild.roles.create({
                    name: '🔒 Quarantine',
                    color: '#FF0000',
                    permissions: [],
                    reason: 'Création automatique pour Anti-Raid'
                });

                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased() || channel.isVoiceBased()) {
                        await channel.permissionOverwrites.create(quarantineRole, {
                            ViewChannel: false,
                            SendMessages: false,
                            Connect: false
                        }).catch(() => { });
                    }
                }

                // Save New Role ID
                db.setGuildConfig(guild.id, 'quarantine_role_id', quarantineRole.id);
            }

            await member.roles.add(quarantineRole, 'Anti-Raid : Connexion suspecte pendant un raid');
            logger.info(`[AntiRaid] ${member.user.tag} quarantined`);

            try {
                const dmEmbed = Response.warning('🔒 Vérification requise')
                    .setDescription(`Vous avez été mis en attente sur **${guild.name}** pour vérification.`)
                    .addFields(
                        { name: '📝 Raison', value: 'Activité suspecte détectée' },
                        { name: '✅ Que faire ?', value: 'Attendez qu\'un modérateur vous vérifie.' }
                    );
                await member.send({ embeds: [dmEmbed] });
            } catch (e) { }

        } catch (err) {
            logger.error('[AntiRaid] Failed to quarantine member:', err.message);
        }
    }

    cleanup() {
        const now = Date.now();
        const maxAge = 60000;

        for (const [guildId, joins] of this.joins.entries()) {
            const recent = joins.filter(j => now - j.time < maxAge);
            if (recent.length === 0) {
                this.joins.delete(guildId);
            } else {
                this.joins.set(guildId, recent);
            }
        }
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

module.exports = AntiRaid;

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

    init() {
        this.client.on('guildMemberAdd', (member) => this.onJoin(member));
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        logger.info('AntiRaid initialized with enforcement enabled');
    }

    async onJoin(member) {
        const guild = member.guild;
        const guildId = guild.id;
        const now = Date.now();

        const config = db.getAutomodConfig(guildId);
        if (!config || !config.antijoinraid) return;

        if (!this.joins.has(guildId)) this.joins.set(guildId, []);
        const arr = this.joins.get(guildId);
        arr.push({ time: now, memberId: member.id });

        const timeframe = parseInt(process.env.ANTIRAID_TIMEFRAME || '10000', 10);
        const threshold = parseInt(process.env.ANTIRAID_THRESHOLD || '10', 10);

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
        logger.warn(`[AntiRaid] RAID DETECTED in ${guild.name}! ${recentJoins.length} joins`);

        for (const join of recentJoins) {
            try {
                const member = await guild.members.fetch(join.memberId).catch(() => null);
                if (member) {
                    await this.handleRaidMember(member);
                }
            } catch (e) {}
        }

        const logChannels = db.getLoggerChannels(guildId);
        if (logChannels?.automod_log) {
            const logChannel = guild.channels.cache.get(logChannels.automod_log);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚨 RAID DÉTECTÉ!')
                    .setDescription(`Mode raid activé automatiquement`)
                    .addFields(
                        { name: '📊 Joins détectés', value: `${recentJoins.length}`, inline: true },
                        { name: '⏱️ Fenêtre', value: `${process.env.ANTIRAID_TIMEFRAME || '10000'}ms`, inline: true },
                        { name: '🛡️ Action', value: 'Nouveaux membres mis en quarantaine', inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        }

        setTimeout(() => {
            this.raidMode.set(guildId, false);
            logger.info(`[AntiRaid] Raid mode deactivated for ${guild.name}`);
        }, 5 * 60 * 1000);
    }

    async handleRaidMember(member) {
        try {
            const guild = member.guild;

            let quarantineRole = guild.roles.cache.find(r => r.name === '🔒 Quarantine');
            if (!quarantineRole) {
                quarantineRole = await guild.roles.create({
                    name: '🔒 Quarantine',
                    color: '#FF0000',
                    permissions: [],
                    reason: 'Auto-created for anti-raid'
                });

                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased() || channel.isVoiceBased()) {
                        await channel.permissionOverwrites.create(quarantineRole, {
                            ViewChannel: false,
                            SendMessages: false,
                            Connect: false
                        }).catch(() => {});
                    }
                }
            }

            await member.roles.add(quarantineRole, 'Anti-Raid: Suspicious join during raid');
            logger.info(`[AntiRaid] ${member.user.tag} quarantined`);

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🔒 Vérification requise')
                    .setDescription(`Vous avez été mis en attente sur **${guild.name}** pour vérification.`)
                    .addFields(
                        { name: '📝 Raison', value: 'Activité suspecte détectée' },
                        { name: '✅ Que faire ?', value: 'Attendez qu\'un modérateur vous vérifie.' }
                    );
                await member.send({ embeds: [dmEmbed] });
            } catch (e) {}

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

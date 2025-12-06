const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');
const logger = require('../../utils/logger');

/**
 * Service de détection et prévention des raids avancés
 */
class AdvancedAntiRaid {
    constructor(client) {
        this.client = client;
        this.joinCache = new Map(); // userId -> timestamp[]
        this.suspiciousPatterns = new Map(); // guildId -> count
    }

    /**
     * Analyser un nouveau membre
     */
    async analyzeMember(member) {
        const guild = member.guild;
        const config = db.getAutomodConfig(guild.id);

        if (!config || !config.antijoinraid) return;

        const suspicionScore = this.calculateSuspicionScore(member);
        const isRaid = this.detectRaidPattern(guild.id);

        logger.debug(`[Anti-Raid] ${member.user.tag} - Suspicion: ${suspicionScore}, Raid: ${isRaid}`);

        // Si raid détecté OU membre très suspect
        if (isRaid || suspicionScore >= 3) {
            await this.quarantineMember(member, suspicionScore, isRaid);
            return true;
        }

        // Si membre suspect (score 1-2)
        if (suspicionScore > 0) {
            await this.flagSuspiciousMember(member, suspicionScore);
        }

        return false;
    }

    /**
     * Calculer le score de suspicion (0-5)
     */
    calculateSuspicionScore(member) {
        let score = 0;
        const user = member.user;
        const accountAge = Date.now() - user.createdTimestamp;
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // 1. Compte très récent (< 24h) = +2
        if (accountAge < oneDay) {
            score += 2;
        }
        // Compte récent (< 7 jours) = +1
        else if (accountAge < oneWeek) {
            score += 1;
        }

        // 2. Pas d'avatar = +1
        if (!user.avatar || user.avatar === user.defaultAvatarURL) {
            score += 1;
        }

        // 3. Nom suspect (zalgo, caractères spéciaux excessifs)
        if (this.isSuspiciousUsername(user.username)) {
            score += 1;
        }

        // 4. Bot (normalement filtré par Discord mais on vérifie)
        if (user.bot) {
            score += 2;
        }

        return Math.min(score, 5);
    }

    /**
     * Détecter un pattern de raid (joins massifs)
     */
    detectRaidPattern(guildId) {
        const now = Date.now();
        const threshold = 10 * 1000; // 10 secondes
        const maxJoins = 5; // 5 joins en 10s = raid

        // Nettoyer les anciennes entrées
        for (const [userId, timestamps] of this.joinCache.entries()) {
            const recent = timestamps.filter(t => now - t < threshold);
            if (recent.length === 0) {
                this.joinCache.delete(userId);
            } else {
                this.joinCache.set(userId, recent);
            }
        }

        // Compter les joins récents pour cette guild
        let recentJoins = 0;
        for (const timestamps of this.joinCache.values()) {
            recentJoins += timestamps.filter(t => now - t < threshold).length;
        }

        return recentJoins >= maxJoins;
    }

    /**
     * Ajouter un join au cache
     */
    trackJoin(member) {
        const now = Date.now();
        const timestamps = this.joinCache.get(member.id) || [];
        timestamps.push(now);
        this.joinCache.set(member.id, timestamps);
    }

    /**
     * Vérifier si le nom est suspect
     */
    isSuspiciousUsername(username) {
        // Zalgo/caractères unicode suspects
        const zalgoRegex = /[\u0300-\u036f\u0489]/g;
        if (zalgoRegex.test(username)) return true;

        // Trop de caractères spéciaux (>50%)
        const specialChars = username.replace(/[a-zA-Z0-9\s]/g, '');
        if (specialChars.length / username.length > 0.5) return true;

        // Nom vide ou trop court
        if (username.trim().length < 2) return true;

        return false;
    }

    /**
     * Mettre en quarantaine un membre
     */
    async quarantineMember(member, suspicionScore, isRaid) {
        try {
            const guild = member.guild;

            // Créer ou récupérer le rôle Quarantine
            let quarantineRole = guild.roles.cache.find(r => r.name === '🔒 Quarantine');

            if (!quarantineRole) {
                quarantineRole = await guild.roles.create({
                    name: '🔒 Quarantine',
                    color: '#FF0000',
                    permissions: [],
                    reason: 'Rôle de quarantaine automatique'
                });

                // Configurer les permissions pour tous les salons
                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased() || channel.isVoiceBased()) {
                        await channel.permissionOverwrites.create(quarantineRole, {
                            ViewChannel: false,
                            SendMessages: false,
                            Connect: false
                        }).catch(() => { });
                    }
                }
            }

            // Appliquer le rôle
            await member.roles.add(quarantineRole, `Anti-Raid: Score ${suspicionScore}, Raid: ${isRaid}`);

            // Logger
            logger.warn(`[Anti-Raid] ${member.user.tag} mis en quarantaine (Score: ${suspicionScore}, Raid: ${isRaid})`);

            // Envoyer notification au salon de logs
            const logChannels = db.getLoggerChannels(guild.id);
            if (logChannels?.automod_log) {
                const logChannel = guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🚨 Membre mis en Quarantaine')
                        .setDescription(`${member} a été automatiquement mis en quarantaine`)
                        .addFields(
                            { name: '👤 Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
                            { name: '📊 Score de suspicion', value: `${suspicionScore}/5`, inline: true },
                            { name: '⚠️ Raid détecté', value: isRaid ? 'Oui' : 'Non', inline: true },
                            { name: '📅 Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                            { name: '🖼️ Avatar', value: member.user.avatar ? 'Oui' : 'Non', inline: true }
                        )
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }

            // Envoyer DM au membre (optionnel)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🔒 Mise en Quarantaine')
                    .setDescription(`Vous avez été mis en quarantaine sur **${guild.name}** pour des raisons de sécurité.`)
                    .addFields(
                        { name: '📝 Raison', value: isRaid ? 'Raid détecté' : 'Compte suspect' },
                        { name: '✅ Que faire ?', value: 'Contactez un modérateur pour être vérifié manuellement.' }
                    );

                await member.send({ embeds: [dmEmbed] });
            } catch (e) {
                // Ignore si DMs fermés
            }

        } catch (err) {
            logger.error('[Anti-Raid] Erreur lors de la quarantaine:', err);
        }
    }

    /**
     * Signaler un membre suspect (sans quarantaine)
     */
    async flagSuspiciousMember(member, suspicionScore) {
        const guild = member.guild;
        const logChannels = db.getLoggerChannels(guild.id);

        if (logChannels?.automod_log) {
            const logChannel = guild.channels.cache.get(logChannels.automod_log);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Membre Suspect Détecté')
                    .setDescription(`${member} présente des signes suspects`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: '📊 Score', value: `${suspicionScore}/5`, inline: true },
                        { name: '📅 Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        }
    }

    /**
     * Nettoyer le cache périodiquement
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 60 * 1000; // 1 minute

        for (const [userId, timestamps] of this.joinCache.entries()) {
            const recent = timestamps.filter(t => now - t < maxAge);
            if (recent.length === 0) {
                this.joinCache.delete(userId);
            } else {
                this.joinCache.set(userId, recent);
            }
        }
    }
}

module.exports = AdvancedAntiRaid;

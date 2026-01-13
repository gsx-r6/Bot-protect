const db = require('../database/database');
const logger = require('../utils/logger');

class TrustScoreService {
    constructor(client) {
        this.client = client;
        this.cache = new Map(); // guildId-userId -> { score, activity_points, last_update }
        this.batchUpdates = new Map(); // guildId-userId -> messageCount
        this.BATCH_THRESHOLD = 5; // Update DB every 5 messages
    }

    async init() {
        logger.info('TrustScoreService initialized.');
    }

    /**
     * Get the trust score of a member, using cache if available.
     */
    async getScore(member) {
        const cacheKey = `${member.guild.id}-${member.id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey).score;
        }

        let data = db.getTrustScoreData(member.guild.id, member.id);

        if (!data) {
            // First time: calculate initial score
            const score = await this.calculateInitialScore(member);
            data = {
                guild_id: member.guild.id,
                user_id: member.id,
                score: score,
                activity_points: 0,
                last_message_at: null,
                global_malus: db.getGlobalMalus(member.id)
            };
            db.upsertTrustScore(member.guild.id, member.id, data);
            db.addTrustHistory(member.guild.id, member.id, score, 'Calcul initial du TrustScore (Âge du compte + Réputation globale)');
        }

        this.cache.set(cacheKey, {
            score: data.score,
            activity_points: data.activity_points,
            last_update: Date.now()
        });

        return data.score;
    }

    /**
     * Calculate a starting score based on account age and global reputation.
     */
    async calculateInitialScore(member) {
        let score = 50; // Base score

        // 1. Account Age (Max +30)
        const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const agePoints = Math.min(30, Math.floor(accountAgeDays / 30) * 5); // 5 points per month
        score += agePoints;

        // 2. Global Malus (Security check)
        const hasGlobalMalus = db.getGlobalMalus(member.id);
        if (hasGlobalMalus) {
            score -= 40; // Heavy penalty for known raiders/nukers
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Add activity points and update score if necessary.
     */
    async addActivity(message) {
        if (!message.guild || message.author.bot) return;

        const member = message.member;
        const cacheKey = `${message.guild.id}-${member.id}`;

        // Batching activity
        const currentBatch = (this.batchUpdates.get(cacheKey) || 0) + 1;
        this.batchUpdates.set(cacheKey, currentBatch);

        if (currentBatch >= this.BATCH_THRESHOLD) {
            this.batchUpdates.delete(cacheKey);
            await this.processPoints(member);
        }
    }

    async processPoints(member) {
        const cacheKey = `${member.guild.id}-${member.id}`;
        const cached = await this.getScoreData(member);

        cached.activity_points += 1; // 1 point per 5 messages (due to threshold)

        // Every 5 activity points (25 messages), gain 1 point of Trust (Max 20 points from activity)
        if (cached.activity_points % 5 === 0 && (cached.score < 100)) {
            const activityContributions = Math.floor(cached.activity_points / 5);
            if (activityContributions <= 20) {
                cached.score += 1;
                db.addTrustHistory(member.guild.id, member.id, 1, 'Incrément d\'activité (Participation régulière)');
            }
        }

        // Persist
        db.upsertTrustScore(member.guild.id, member.id, {
            score: cached.score,
            activity_points: cached.activity_points,
            last_message_at: new Date().toISOString()
        });

        this.cache.set(cacheKey, cached);
    }

    async getScoreData(member) {
        const cacheKey = `${member.guild.id}-${member.id}`;
        if (!this.cache.has(cacheKey)) {
            await this.getScore(member);
        }
        return this.cache.get(cacheKey);
    }

    /**
     * Apply penalites (e.g., from warn/mute)
     */
    async addPenalty(guildId, userId, amount, reason) {
        const data = db.getTrustScoreData(guildId, userId);
        if (!data) return;

        const newScore = Math.max(0, data.score - amount);
        db.upsertTrustScore(guildId, userId, { score: newScore });
        db.addTrustHistory(guildId, userId, -amount, `Pénalité : ${reason}`);

        // Update Cache
        const cacheKey = `${guildId}-${userId}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            cached.score = newScore;
            this.cache.set(cacheKey, cached);
        }
    }

    /**
     * Main check for message restrictions based on TrustScore.
     */
    async checkRestrictions(message) {
        if (!message.guild || message.author.bot) return false;

        // Admins bypass everything
        if (message.member.permissions.has('Administrator')) return false;

        const score = await this.getScore(message.member);
        const config = db.getTrustConfig(message.guild.id) || {
            min_score_link: 30,
            min_score_media: 20
        };

        // Tier 1: Links
        if (score < config.min_score_link) {
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            if (linkRegex.test(message.content)) {
                await message.delete().catch(() => { });
                const reply = await message.channel.send(`⚠️ ${message.author}, votre score de confiance (**${score}**) est trop faible pour envoyer des liens. Améliorez votre score en participant au serveur.`);
                setTimeout(() => reply.delete().catch(() => { }), 5000);
                return true;
            }
        }

        // Tier 2: Media (Attachments)
        if (score < config.min_score_media) {
            if (message.attachments.size > 0) {
                await message.delete().catch(() => { });
                const reply = await message.channel.send(`⚠️ ${message.author}, votre score de confiance (**${score}**) est trop faible pour envoyer des médias.`);
                setTimeout(() => reply.delete().catch(() => { }), 5000);
                return true;
            }
        }

        return false;
    }
}

module.exports = TrustScoreService;

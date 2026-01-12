const logger = require('../utils/logger');
const db = require('../database/database');
const { EmbedBuilder } = require('discord.js');

class AntiBot {
    constructor(client) {
        this.client = client;
        this.whitelist = new Set();
    }

    init() {
        logger.info('AntiBot initialized (Stand-alone mode)');
    }

    async onMemberAdd(member) {
        if (!member.user.bot) return;

        const config = db.getAutomodConfig(member.guild.id);
        if (!config || !config.antibot) return;

        if (this.whitelist.has(member.user.id)) {
            logger.info(`[AntiBot] Whitelisted bot ${member.user.tag} joined`);
            return;
        }

        try {
            await member.kick('AntiBot: Bot non autorisé');
            logger.warn(`[AntiBot] Kicked unauthorized bot ${member.user.tag} from ${member.guild.name}`);

            const logChannels = db.getLoggerChannels(member.guild.id);
            if (logChannels?.automod_log) {
                const logChannel = member.guild.channels.cache.get(logChannels.automod_log);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🤖 Bot Non Autorisé Expulsé')
                        .setDescription(`Le bot ${member.user.tag} a été expulsé automatiquement`)
                        .addFields(
                            { name: '🤖 Bot', value: `${member.user.tag} (${member.id})`, inline: true },
                            { name: '📅 Créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                        )
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();

                    await logChannel.send({ embeds: [embed] });
                }
            }
        } catch (err) {
            logger.error('[AntiBot] Failed to kick bot:', err.message);
        }
    }

    addToWhitelist(botId) {
        this.whitelist.add(botId);
    }

    removeFromWhitelist(botId) {
        this.whitelist.delete(botId);
    }
}

module.exports = AntiBot;

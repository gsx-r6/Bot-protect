const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');

// Map pour stocker l'historique des messages: { guildId: { userId: [timestamps] } }
const messageHistory = new Map();

// Configuration Anti-Spam (pourrait être en DB plus tard pour plus de finesse)
const SPAM_LIMIT = 5; // 5 messages
const SPAM_TIME = 5000; // en 5 secondes
const MUTE_DURATION = 60 * 1000; // 1 minute

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        // Ignorer les admins/modos
        if (message.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        // Vérifier si l'anti-spam est activé
        const config = db.getAutomodConfig(message.guild.id);
        if (!config || !config.antispam) return;

        const now = Date.now();
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!messageHistory.has(guildId)) messageHistory.set(guildId, new Map());
        const guildHistory = messageHistory.get(guildId);

        if (!guildHistory.has(userId)) guildHistory.set(userId, []);
        const userHistory = guildHistory.get(userId);

        // Ajouter le timestamp actuel
        userHistory.push(now);

        // Nettoyer les vieux timestamps
        const recentMessages = userHistory.filter(timestamp => now - timestamp < SPAM_TIME);
        guildHistory.set(userId, recentMessages);

        // Vérifier la limite
        if (recentMessages.length > SPAM_LIMIT) {
            // Détection de spam !

            // Reset l'historique pour éviter de spammer le mute
            guildHistory.set(userId, []);

            try {
                if (message.member.moderatable) {
                    if (client.muteService) {
                        await client.muteService.mute(message.member, MUTE_DURATION, '[🛡️ UHQ SECURITY] Envoi excessif de messages (Anti-Spam).', client.user);
                    } else {
                        await message.member.timeout(MUTE_DURATION, '[🛡️ UHQ SECURITY] Envoi excessif de messages (Anti-Spam).');
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setDescription(`⚠️ **${message.author}, vous envoyez des messages trop vite. Vous avez été rendu muet pour 1 minute.**`)
                        .setFooter({ text: 'Nami Protect 🛡️' });

                    const msg = await message.channel.send({ embeds: [embed] });
                    setTimeout(() => msg.delete().catch(() => { }), 10000);

                    // Log
                    if (client.logs) {
                        client.logs.logModeration(message.guild, 'MUTE (AUTO)', {
                            user: message.author,
                            moderator: client.user,
                            reason: 'Anti-Spam: Flood détecté',
                            duration: '1m'
                        });
                    }
                }
            } catch (err) {
                client.logger.error(`AntiSpam Error: ${err.message}`);
            }
        }
    }
};

const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

// Stockage temporaire des giveaways actifs (en production, utiliser la DB)
const activeGiveaways = new Map();

module.exports = {
    name: 'giveaway',
    description: 'Créer un giveaway',
    category: 'utility',
    aliases: ['gstart', 'gcreate'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 30,
    usage: '<durée> <gagnants> <prix>',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (args.length < 3) {
                return message.reply({ embeds: [embeds.error('Utilisation: `+giveaway <durée> <gagnants> <prix>`\nExemple: `+giveaway 1h 2 Nitro Classic`')] });
            }

            // Parser la durée
            const durationStr = args[0];
            const duration = parseDuration(durationStr);
            if (!duration) {
                return message.reply({ embeds: [embeds.error('Durée invalide. Utilisez: 1m, 5m, 1h, 2h, 1d, etc.')] });
            }

            // Nombre de gagnants
            const winners = parseInt(args[1]);
            if (isNaN(winners) || winners < 1 || winners > 20) {
                return message.reply({ embeds: [embeds.error('Nombre de gagnants invalide (1-20)')] });
            }

            // Prix
            const prize = args.slice(2).join(' ');

            // Créer l'embed du giveaway
            const endTime = Date.now() + duration;
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🎉 GIVEAWAY 🎉')
                .setDescription(`**Prix:** ${prize}\n\n**Gagnants:** ${winners}\n**Fin:** <t:${Math.floor(endTime / 1000)}:R>\n\nRéagissez avec 🎉 pour participer !`)
                .setFooter({ text: `Organisé par ${message.author.tag}` })
                .setTimestamp(endTime);

            const giveawayMsg = await message.channel.send({ embeds: [embed] });
            await giveawayMsg.react('🎉');

            // Stocker le giveaway
            const giveawayData = {
                messageId: giveawayMsg.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                prize,
                winners,
                endTime,
                hostId: message.author.id
            };

            activeGiveaways.set(giveawayMsg.id, giveawayData);

            // Programmer la fin
            setTimeout(async () => {
                await endGiveaway(giveawayMsg.id, client);
            }, duration);

            await message.reply({ embeds: [embeds.success(`Giveaway créé ! Fin dans ${durationStr}`)] });
            client.logger.command(`GIVEAWAY created by ${message.author.tag}: ${prize} (${winners} winners, ${durationStr})`);

        } catch (err) {
            client.logger.error('Giveaway command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la création du giveaway')] });
        }
    }
};

function parseDuration(str) {
    const regex = /^(\d+)([smhd])$/;
    const match = str.match(regex);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };

    return value * multipliers[unit];
}

async function endGiveaway(messageId, client) {
    try {
        const giveaway = activeGiveaways.get(messageId);
        if (!giveaway) return;

        const channel = await client.channels.fetch(giveaway.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(giveaway.messageId);
        if (!message) return;

        // Récupérer les participants
        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            await channel.send('❌ Aucun participant au giveaway !');
            activeGiveaways.delete(messageId);
            return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(u => !u.bot);

        if (participants.size === 0) {
            await channel.send('❌ Aucun participant valide au giveaway !');
            activeGiveaways.delete(messageId);
            return;
        }

        // Sélectionner les gagnants
        const winnersCount = Math.min(giveaway.winners, participants.size);
        const winnersArray = participants.random(winnersCount);
        const winners = Array.isArray(winnersArray) ? winnersArray : [winnersArray];

        // Annoncer les gagnants
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 GIVEAWAY TERMINÉ 🎉')
            .setDescription(`**Prix:** ${giveaway.prize}\n\n**Gagnant(s):**\n${winners.map(w => `🏆 ${w}`).join('\n')}\n\nFélicitations !`)
            .setFooter({ text: `Organisé par ${message.guild.members.cache.get(giveaway.hostId)?.user.tag || 'Inconnu'}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        // Mettre à jour le message original
        const oldEmbed = message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor('#808080')
            .setDescription(`**Prix:** ${giveaway.prize}\n\n**Gagnant(s):**\n${winners.map(w => `🏆 ${w}`).join('\n')}\n\n✅ Terminé`);

        await message.edit({ embeds: [updatedEmbed] });

        activeGiveaways.delete(messageId);
    } catch (err) {
        console.error('Error ending giveaway:', err);
    }
}

// Exporter pour utilisation dans reroll
module.exports.activeGiveaways = activeGiveaways;
module.exports.endGiveaway = endGiveaway;

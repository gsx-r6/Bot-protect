const { EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database/database');
const canvasHelper = require('../../utils/canvasHelper');
const ConfigService = require('../../services/ConfigService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'trust',
    description: 'Voir le niveau de confiance d\'un membre',
    category: 'security',
    usage: '[@membre]',
    cooldown: 5,

    async execute(message, args, client) {
        const guildId = message.guild.id;
        const color = ConfigService.getEmbedColor(guildId);

        let target = message.mentions.members.first() || message.member;

        // Handle ID
        if (!target && args[0]) {
            target = await message.guild.members.fetch(args[0]).catch(() => null);
        }

        if (!target) return message.reply({ embeds: [embeds.error('Membre introuvable.')] });

        // Admin override check: set trust manually
        if (args[0] === 'set' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const userArg = args[1];
            const scoreArg = parseInt(args[2]);

            if (isNaN(scoreArg) || scoreArg < 0 || scoreArg > 100) {
                return message.reply({ embeds: [embeds.error('Usage : `+trust set <@user/ID> <0-100>`')] });
            }

            let memberToSet = message.mentions.members.first() || await message.guild.members.fetch(userArg).catch(() => null);
            if (!memberToSet) return message.reply({ embeds: [embeds.error('Membre introuvable.')] });

            db.upsertTrustScore(guildId, memberToSet.id, { score: scoreArg });
            db.addTrustHistory(guildId, memberToSet.id, 0, `Forçage manuel par ${message.author.tag} à ${scoreArg}`);

            return message.reply({ embeds: [embeds.success(`Le score de confiance de **${memberToSet.user.tag}** a été fixé à **${scoreArg}/100**.`)] });
        }

        const score = await client.trustScore.getScore(target);
        const history = db.getTrustHistory(guildId, target.id);
        const gaugeBuffer = await canvasHelper.generateTrustGauge(score);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `Analyse de Confiance : ${target.user.tag}`, iconURL: target.user.displayAvatarURL() })
            .setDescription(`Le TrustScore évalue la fiabilité d'un membre en fonction de son activité et de son historique de modération.`)
            .addFields(
                {
                    name: '📊 Facteurs Actuels',
                    value: [
                        `• **Âge Compte:** ${Math.floor((Date.now() - target.user.createdTimestamp) / (1000 * 60 * 60 * 24))} jours`,
                        `• **Ancienneté Serveur:** ${Math.floor((Date.now() - target.joinedTimestamp) / (1000 * 60 * 60 * 24))} jours`,
                        `• **Malus Global:** ${db.getGlobalMalus(target.id) ? '⚠️ OUI (Haut Risque)' : '✅ NON'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📜 Historique Récent',
                    value: history.length > 0
                        ? history.map(h => `\`${h.timestamp.split('T')[0]}\` | **${h.change_amount > 0 ? '+' : ''}${h.change_amount}** : ${h.reason}`).join('\n')
                        : 'Aucun historique disponible.',
                    inline: false
                }
            )
            .setFooter({ text: 'UHQ Trust System v1.0' })
            .setTimestamp();

        if (gaugeBuffer) {
            const attachment = new AttachmentBuilder(gaugeBuffer, { name: 'trust.png' });
            embed.setImage('attachment://trust.png');
            return message.reply({ embeds: [embed], files: [attachment] });
        } else {
            embed.addFields({ name: 'Confiance', value: `**${score}/100**` });
            return message.reply({ embeds: [embed] });
        }
    }
};

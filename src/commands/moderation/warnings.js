const embeds = require('../../utils/embeds');
const db = require('../../database/database');

module.exports = {
    name: 'warnings',
    description: 'Voir les avertissements d\'un membre',
    category: 'moderation',
    aliases: ['warns', 'listwarns'],
    cooldown: 3,
    usage: '[@membre]',
    
    async execute(message, args, client) {
        try {
            const target = message.mentions.members.first() || message.member;
            
            const warnings = db.getWarnings(message.guild.id, target.id);
            
            if (!warnings || warnings.length === 0) {
                return message.reply({ embeds: [embeds.info(`${target.user.tag} n'a aucun avertissement.`, '📋 Avertissements')] });
            }
            
            const fields = warnings.map((w, i) => ({
                name: `#${i + 1} - ${new Date(w.created_at).toLocaleDateString('fr-FR')}`,
                value: `**Raison:** ${w.reason}\n**Modérateur:** <@${w.moderator_id}>`,
                inline: false
            }));
            
            const embed = embeds.moderation('', '⚠️ Liste des avertissements', {
                fields: [
                    { name: '👤 Membre', value: `${target.user.tag}`, inline: true },
                    { name: '📊 Total', value: `${warnings.length} avertissement(s)`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    ...fields.slice(0, 10)
                ],
                thumbnail: target.user.displayAvatarURL({ dynamic: true })
            });
            
            if (warnings.length > 10) {
                embed.setFooter({ text: `{+} Nami Protection • ${warnings.length - 10} avertissement(s) supplémentaire(s) non affichés` });
            }
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur warnings:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

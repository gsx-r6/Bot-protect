const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');

module.exports = {
    name: 'logstatus',
    description: 'Affiche l\'état de chaque log activé',
    category: 'logging',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const stmt = db.db.prepare('SELECT * FROM logs_config WHERE guild_id = ?');
            const config = stmt.get(message.guild.id);

            const embed = embeds.info('', '📊 État des Logs', {
                fields: [
                    { name: '📝 Message Log', value: config?.message_log ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: '👋 Join Log', value: config?.join_log ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: '👋 Leave Log', value: config?.leave_log ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: '🛡️ Mod Log', value: config?.mod_log ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: '🔊 Voice Log', value: config?.voice_log ? '✅ Activé' : '❌ Désactivé', inline: true },
                    { name: '💡 Info', value: 'Utilisez `+[type]log on/off` pour activer/désactiver', inline: false }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Logstatus command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du statut des logs.')] });
        }
    }
};

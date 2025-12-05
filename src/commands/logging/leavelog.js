const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');

module.exports = {
    name: 'leavelog',
    description: 'Enregistre les départs',
    category: 'logging',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[on/off]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                let stmt = db.db.prepare('SELECT * FROM logs_config WHERE guild_id = ?');
                let config = stmt.get(message.guild.id);
                const current = config?.leave_log || false;
                return message.reply({ embeds: [embeds.info(`État actuel: ${current ? '✅ Activé' : '❌ Désactivé'}`, '👋 Leave Log').addFields({ name: 'Usage', value: '`+leavelog on` ou `+leavelog off`' })] });
            }

            const enabled = action === 'on' ? 1 : 0;
            
            let stmt = db.db.prepare('SELECT * FROM logs_config WHERE guild_id = ?');
            let config = stmt.get(message.guild.id);
            
            if (!config) {
                stmt = db.db.prepare('INSERT INTO logs_config (guild_id, leave_log, updated_at) VALUES (?, ?, ?)');
                stmt.run(message.guild.id, enabled, new Date().toISOString());
            } else {
                stmt = db.db.prepare('UPDATE logs_config SET leave_log = ?, updated_at = ? WHERE guild_id = ?');
                stmt.run(enabled, new Date().toISOString(), message.guild.id);
            }

            const embed = embeds.success(`Leave log ${enabled ? 'activé' : 'désactivé'}`, '👋 Configuration');
            await message.reply({ embeds: [embed] });

            client.logger.command(`LEAVELOG ${action} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Leavelog command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration du leave log.')] });
        }
    }
};

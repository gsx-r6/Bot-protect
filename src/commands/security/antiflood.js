const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'antiflood',
    description: 'Bloque le spam de messages rapides',
    category: 'security',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 3,
    usage: '[on/off]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                const current = AutomodService.isEnabled(message.guild.id, 'antiflood');
                return message.reply({ embeds: [embeds.info(`État actuel: ${current ? '✅ Activé' : '❌ Désactivé'}`, '🛡️ Anti-Flood').addFields({ name: 'Usage', value: '`+antiflood on` ou `+antiflood off`' })] });
            }

            const enabled = action === 'on';
            AutomodService.setFeature(message.guild.id, 'antiflood', enabled);

            const embed = embeds.success(`Anti-flood ${enabled ? 'activé' : 'désactivé'}`, '🛡️ Configuration Sécurité');
            await message.reply({ embeds: [embed] });

            client.logger.command(`ANTIFLOOD ${action} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Antiflood command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration anti-flood.')] });
        }
    }
};

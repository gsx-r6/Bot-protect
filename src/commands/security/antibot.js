const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'antibot',
    description: 'Empêche l\'ajout non autorisé de bots',
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
                const current = AutomodService.isEnabled(message.guild.id, 'antibot');
                return message.reply({ embeds: [embeds.info(`État actuel: ${current ? '✅ Activé' : '❌ Désactivé'}`, '🛡️ Anti-Bot').addFields({ name: 'Usage', value: '`+antibot on` ou `+antibot off`' })] });
            }

            const enabled = action === 'on';
            AutomodService.setFeature(message.guild.id, 'antibot', enabled);

            const embed = embeds.success(`Anti-bot ${enabled ? 'activé' : 'désactivé'}`, '🛡️ Configuration Sécurité');
            await message.reply({ embeds: [embed] });

            client.logger.command(`ANTIBOT ${action} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Antibot command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration anti-bot.')] });
        }
    }
};

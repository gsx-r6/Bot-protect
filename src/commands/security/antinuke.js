const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'antinuke',
    description: 'Empêche les suppressions/modifications massives',
    category: 'security',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 3,
    usage: '[on/off]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                const current = AutomodService.isEnabled(message.guild.id, 'antinuke');
                return message.reply({ embeds: [embeds.info(`État actuel: ${current ? '✅ Activé' : '❌ Désactivé'}`, '🛡️ Anti-Nuke').addFields({ name: 'Usage', value: '`+antinuke on` ou `+antinuke off`' })] });
            }

            const enabled = action === 'on';
            AutomodService.setFeature(message.guild.id, 'antinuke', enabled);

            const embed = embeds.success(`Anti-nuke ${enabled ? 'activé' : 'désactivé'}`, '🛡️ Configuration Sécurité');
            await message.reply({ embeds: [embed] });

            client.logger.command(`ANTINUKE ${action} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Antinuke command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration anti-nuke.')] });
        }
    }
};

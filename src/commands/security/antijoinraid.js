const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'antijoinraid',
    description: 'Active la protection contre les raids',
    category: 'security',
    permissions: [PermissionFlagsBits.ManageGuild],
    aliases: ['antiraid'],
    cooldown: 3,
    usage: '[on/off]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                const current = AutomodService.isEnabled(message.guild.id, 'antijoinraid');
                return message.reply({ embeds: [embeds.info(`État actuel: ${current ? '✅ Activé' : '❌ Désactivé'}`, '🛡️ Anti-Raid').addFields({ name: 'Usage', value: '`+antijoinraid on` ou `+antijoinraid off`' })] });
            }

            const enabled = action === 'on';
            AutomodService.setFeature(message.guild.id, 'antijoinraid', enabled);

            const embed = embeds.success(`Anti-raid ${enabled ? 'activé' : 'désactivé'}`, '🛡️ Configuration Sécurité');
            await message.reply({ embeds: [embed] });

            client.logger.command(`ANTIJOINRAID ${action} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Antijoinraid command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration anti-raid.')] });
        }
    }
};

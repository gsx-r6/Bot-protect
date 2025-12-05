const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'maintenance',
    description: 'Active le mode maintenance du bot',
    category: 'administration',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    usage: '[on/off]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                const current = client.maintenanceMode || false;
                return message.reply({ embeds: [embeds.info(`Mode maintenance: ${current ? '✅ Activé' : '❌ Désactivé'}`, '🔧 Maintenance').addFields({ name: 'Usage', value: '`+maintenance on` ou `+maintenance off`' })] });
            }

            client.maintenanceMode = action === 'on';

            const embed = embeds.success(`Mode maintenance ${client.maintenanceMode ? 'activé' : 'désactivé'}`, '🔧 Maintenance');
            await message.reply({ embeds: [embed] });

            client.logger.command(`MAINTENANCE ${action} by ${message.author.tag}`);
        } catch (err) {
            client.logger.error('Maintenance command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du changement de mode maintenance.')] });
        }
    }
};

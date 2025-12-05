const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'slowmode',
    description: 'Configurer le slowmode d\'un salon (ex: 5s, 1m, off)',
    category: 'moderation',
    permissions: [PermissionFlagsBits.ManageChannels],
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            const input = args[0];
            if (!input) return message.reply({ embeds: [embeds.error('Usage: slowmode <durée|off> (ex: 5s, 1m, off)')] });

            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) || message.channel;
            if (!channel || channel.isDMBased()) return message.reply({ embeds: [embeds.error('Salon invalide')] });

            if (input.toLowerCase() === 'off') {
                await channel.setRateLimitPerUser(0);
                return message.reply({ embeds: [embeds.success('Slowmode désactivé')] });
            }

            const ms = parseDuration(input);
            if (ms === null || ms > 21600000) return message.reply({ embeds: [embeds.error('Durée invalide ou supérieure à 6h')] });
            await channel.setRateLimitPerUser(Math.floor(ms / 1000));
            return message.reply({ embeds: [embeds.success(`Slowmode défini à ${input}`)] });
        } catch (err) {
            client.logger.error('Error in slowmode: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration du slowmode')] });
        }
    }
};

function parseDuration(str) {
    const match = /^([0-9]+)(s|m|h)$/.exec(str.toLowerCase());
    if (!match) return null;
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const units = { s: 1000, m: 60000, h: 3600000 };
    return n * units[unit];
}

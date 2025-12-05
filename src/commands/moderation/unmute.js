const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Enlever le timeout d\'un membre',
    category: 'moderation',
    aliases: ['untimeout'],
    cooldown: 3,
    usage: '<@membre>',
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de démute des membres.')] });
            }
            
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre à démute.')] });
            }
            
            if (!target.isCommunicationDisabled()) {
                return message.reply({ embeds: [embeds.error('Ce membre n\'est pas en timeout.')] });
            }
            
            await target.timeout(null, `Unmute par: ${message.author.tag}`);

            // Log vers LogService
            try {
                if (client.logs) {
                    await client.logs.logModeration(message.guild, 'UNMUTE', {
                        user: target.user,
                        moderator: message.author
                    });
                }
            } catch (e) {
                client.logger.error('[unmute] Error sending log:', e);
            }

            const embed = embeds.moderation(
                `✅ **Membre démute avec succès**\n\n` +
                `**Membre:** ${target.user.tag}\n` +
                `**Modérateur:** ${message.author}`,
                '🔊 Unmute'
            );
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur unmute:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

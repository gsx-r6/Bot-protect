const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    name: 'delwarn',
    description: 'Supprimer un avertissement précis',
    category: 'moderation',
    aliases: ['removewarn', 'unwarn'],
    cooldown: 3,
    usage: '<@membre> <numéro>',
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de gérer les avertissements.')] });
            }
            
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre.')] });
            }
            
            const warnNumber = parseInt(args[1]);
            if (!warnNumber || warnNumber < 1) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir un numéro d\'avertissement valide.')] });
            }
            
            const warnings = db.getWarnings(message.guild.id, target.id);
            
            if (!warnings || warnings.length === 0) {
                return message.reply({ embeds: [embeds.error('Ce membre n\'a aucun avertissement.')] });
            }
            
            if (warnNumber > warnings.length) {
                return message.reply({ embeds: [embeds.error(`Ce membre n'a que ${warnings.length} avertissement(s).`)] });
            }
            
            const warnToDelete = warnings[warnNumber - 1];
            db.deleteWarning(warnToDelete.id);

            // Log vers LogService
            try {
                if (client.logs) {
                    await client.logs.logModeration(message.guild, 'DELWARN', {
                        user: target.user,
                        moderator: message.author,
                        reason: warnToDelete.reason,
                        extras: { warnId: warnToDelete.id }
                    });
                }
            } catch (e) {
                client.logger.error('[delwarn] Error sending log:', e);
            }

            const embed = embeds.moderation(
                `✅ **Avertissement #${warnNumber} supprimé avec succès**\n\n` +
                `**Membre:** ${target.user.tag}\n` +
                `**Raison de l'avertissement:** ${warnToDelete.reason}\n` +
                `**Modérateur:** ${message.author}`,
                '🗑️ Suppression d\'avertissement'
            );
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            client.logger.error('Erreur delwarn:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue.')] });
        }
    }
};

const embeds = require('../../utils/embeds');
const { PermissionsBitField } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    name: 'warn',
    description: 'Donner un avertissement à un membre',
    category: 'moderation',
    aliases: ['w'],
    cooldown: 3,
    usage: '<@membre> <raison>',
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [embeds.error('Vous n\'avez pas la permission de gérer les avertissements.')] });
            }

            let targetUser = message.mentions.users.first();
            if (!targetUser && args[0]) {
                try {
                    targetUser = await client.users.fetch(args[0]);
                } catch (e) { }
            }

            if (!targetUser) return message.reply({ embeds: [embeds.error('Membre introuvable (Mention ou ID).')] });

            const target = await message.guild.members.fetch(targetUser.id).catch(() => null);
            if (!target) return message.reply({ embeds: [embeds.error('Ce membre n\'est pas sur le serveur.')] });

            if (target.id === message.author.id) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas vous avertir vous-même.')] });
            }

            if (target.id === client.user.id) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas être averti.')] });
            }

            const reason = args.slice(1).join(' ');
            if (!reason) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir une raison pour l\'avertissement.')] });
            }

            db.addWarning(message.guild.id, target.id, message.author.id, reason);
            const totalWarns = db.getWarningCount(message.guild.id, target.id);

            const embed = embeds.moderation(
                `✅ **Avertissement donné avec succès**\n\n` +
                `**Membre:** ${target.user.tag}\n` +
                `**Raison:** ${reason}\n` +
                `**Total d'avertissements:** ${totalWarns}\n` +
                `**Modérateur:** ${message.author}`,
                '⚠️ Avertissement'
            );

            await message.reply({ embeds: [embed] });

            try {
                await target.send({
                    embeds: [embeds.warn(
                        `Vous avez reçu un avertissement sur **${message.guild.name}**\n\n` +
                        `**Raison:** ${reason}\n` +
                        `**Total:** ${totalWarns} avertissement(s)`,
                        '⚠️ Avertissement'
                    )]
                });
            } catch (e) {
                // Impossible d'envoyer un MP
            }

            // Log vers LogService
            if (client.logs) {
                await client.logs.logModeration(message.guild, 'WARN', {
                    user: target.user,
                    moderator: message.author,
                    reason: reason,
                    extras: { totalWarns }
                });
            }

            client.logger.command(`WARN: ${target.user.tag} by ${message.author.tag} - ${reason}`);

        } catch (err) {
            client.logger.error('Error in warn command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'avertissement.')] });
        }
    }
};

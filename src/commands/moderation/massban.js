const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const PermissionHandler = require('../../utils/PermissionHandler');

module.exports = {
    name: 'massban',
    description: 'Bannir plusieurs utilisateurs d\'un coup',
    category: 'moderation',
    aliases: ['mban'],
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 10,
    usage: '<@user1> <@user2> ... [raison]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (args.length < 1) {
                return message.reply({ embeds: [embeds.error('Mentionnez au moins un utilisateur.\nUtilisage: `+massban @user1 @user2 [raison]`')] });
            }

            const members = message.mentions.members;
            if (members.size === 0) {
                return message.reply({ embeds: [embeds.error('Aucun membre mentionné valide')] });
            }

            // Extraire la raison (tout après les mentions)
            const reason = args.slice(members.size).join(' ') || 'Aucune raison fournie';

            const loadingMsg = await message.reply({ embeds: [embeds.info(`⏳ Ban de ${members.size} membre(s) en cours...`)] });

            let banned = 0;
            let failed = 0;
            const errors = [];

            for (const member of members.values()) {
                try {
                    // Vérifications
                    if (member.id === message.author.id) {
                        errors.push(`${member.user.tag}: Vous ne pouvez pas vous bannir`);
                        failed++;
                        continue;
                    }

                    // Vérification de la Hiérarchie (PermissionHandler)
                    if (!PermissionHandler.checkHierarchy(message.member, member)) {
                        errors.push(`${member.user.tag}: Hiérarchie insuffisante`);
                        failed++;
                        continue;
                    }

                    if (!member.bannable) {
                        errors.push(`${member.user.tag}: Non bannable`);
                        failed++;
                        continue;
                    }

                    await member.ban({ reason: `Massban par ${message.author.tag}: ${reason}` });
                    banned++;
                } catch (err) {
                    errors.push(`${member.user.tag}: ${err.message}`);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(banned > 0 ? '#00FF00' : '#FF0000')
                .setTitle('🔨 Mass Ban Terminé')
                .addFields(
                    { name: '✅ Bannis', value: `${banned}`, inline: true },
                    { name: '❌ Échecs', value: `${failed}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                );

            if (errors.length > 0 && errors.length <= 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: errors.join('\n'), inline: false });
            } else if (errors.length > 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: `${errors.length} erreurs (trop pour afficher)`, inline: false });
            }

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`MASSBAN by ${message.author.tag}: ${banned} banned, ${failed} failed`);

        } catch (err) {
            client.logger.error('Massban command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du massban')] });
        }
    }
};

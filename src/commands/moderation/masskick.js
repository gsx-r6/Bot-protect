const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'masskick',
    description: 'Expulser plusieurs utilisateurs d\'un coup',
    category: 'moderation',
    aliases: ['mkick'],
    permissions: [PermissionFlagsBits.KickMembers],
    cooldown: 10,
    usage: '<@user1> <@user2> ... [raison]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (args.length < 1) {
                return message.reply({ embeds: [embeds.error('Mentionnez au moins un utilisateur.\nUtilisage: `+masskick @user1 @user2 [raison]`')] });
            }

            const members = message.mentions.members;
            if (members.size === 0) {
                return message.reply({ embeds: [embeds.error('Aucun membre mentionné valide')] });
            }

            const reason = args.slice(members.size).join(' ') || 'Aucune raison fournie';

            const loadingMsg = await message.reply({ embeds: [embeds.info(`⏳ Kick de ${members.size} membre(s) en cours...`)] });

            let kicked = 0;
            let failed = 0;
            const errors = [];

            for (const member of members.values()) {
                try {
                    if (member.id === message.author.id) {
                        errors.push(`${member.user.tag}: Vous ne pouvez pas vous expulser`);
                        failed++;
                        continue;
                    }

                    if (member.roles.highest.position >= message.member.roles.highest.position) {
                        errors.push(`${member.user.tag}: Rôle supérieur ou égal`);
                        failed++;
                        continue;
                    }

                    if (!member.kickable) {
                        errors.push(`${member.user.tag}: Non expulsable`);
                        failed++;
                        continue;
                    }

                    await member.kick(`Masskick par ${message.author.tag}: ${reason}`);
                    kicked++;
                } catch (err) {
                    errors.push(`${member.user.tag}: ${err.message}`);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(kicked > 0 ? '#00FF00' : '#FF0000')
                .setTitle('👢 Mass Kick Terminé')
                .addFields(
                    { name: '✅ Expulsés', value: `${kicked}`, inline: true },
                    { name: '❌ Échecs', value: `${failed}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                );

            if (errors.length > 0 && errors.length <= 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: errors.join('\n'), inline: false });
            } else if (errors.length > 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: `${errors.length} erreurs (trop pour afficher)`, inline: false });
            }

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`MASSKICK by ${message.author.tag}: ${kicked} kicked, ${failed} failed`);

        } catch (err) {
            client.logger.error('Masskick command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du masskick')] });
        }
    }
};

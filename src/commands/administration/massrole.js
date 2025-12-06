const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'massrole',
    description: 'Ajouter ou retirer un rôle à plusieurs utilisateurs',
    category: 'administration',
    aliases: ['mrole'],
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 10,
    usage: '<add|remove> <@role> <@user1> <@user2> ...',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (args.length < 3) {
                return message.reply({ embeds: [embeds.error('Utilisation: `+massrole <add|remove> @role @user1 @user2 ...`')] });
            }

            const action = args[0].toLowerCase();
            if (!['add', 'remove'].includes(action)) {
                return message.reply({ embeds: [embeds.error('Action invalide. Utilisez `add` ou `remove`')] });
            }

            const role = message.mentions.roles.first();
            if (!role) {
                return message.reply({ embeds: [embeds.error('Aucun rôle mentionné')] });
            }

            const members = message.mentions.members;
            if (members.size === 0) {
                return message.reply({ embeds: [embeds.error('Aucun membre mentionné')] });
            }

            // Vérifier que le rôle est gérable
            if (role.position >= message.guild.members.me.roles.highest.position) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas gérer ce rôle (position trop élevée)')] });
            }

            if (role.position >= message.member.roles.highest.position) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas gérer ce rôle (position trop élevée)')] });
            }

            const loadingMsg = await message.reply({ embeds: [embeds.info(`⏳ ${action === 'add' ? 'Ajout' : 'Retrait'} du rôle ${role.name} pour ${members.size} membre(s)...`)] });

            let success = 0;
            let failed = 0;
            const errors = [];

            for (const member of members.values()) {
                try {
                    if (action === 'add') {
                        if (member.roles.cache.has(role.id)) {
                            errors.push(`${member.user.tag}: A déjà le rôle`);
                            failed++;
                            continue;
                        }
                        await member.roles.add(role, `Massrole par ${message.author.tag}`);
                    } else {
                        if (!member.roles.cache.has(role.id)) {
                            errors.push(`${member.user.tag}: N'a pas le rôle`);
                            failed++;
                            continue;
                        }
                        await member.roles.remove(role, `Massrole par ${message.author.tag}`);
                    }
                    success++;
                } catch (err) {
                    errors.push(`${member.user.tag}: ${err.message}`);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(success > 0 ? '#00FF00' : '#FF0000')
                .setTitle(`🎭 Mass Role ${action === 'add' ? 'Ajout' : 'Retrait'} Terminé`)
                .addFields(
                    { name: '🎭 Rôle', value: role.name, inline: true },
                    { name: '✅ Succès', value: `${success}`, inline: true },
                    { name: '❌ Échecs', value: `${failed}`, inline: true }
                );

            if (errors.length > 0 && errors.length <= 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: errors.join('\n'), inline: false });
            } else if (errors.length > 5) {
                embed.addFields({ name: '⚠️ Erreurs', value: `${errors.length} erreurs (trop pour afficher)`, inline: false });
            }

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`MASSROLE ${action} by ${message.author.tag}: ${success} success, ${failed} failed`);

        } catch (err) {
            client.logger.error('Massrole command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du massrole')] });
        }
    }
};

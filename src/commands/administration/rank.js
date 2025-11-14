const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const RankPermissionService = require('../../services/RankPermissionService');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'rank',
    description: 'Donner ou retirer un rôle à un membre selon les permissions hiérarchiques',
    category: 'administration',
    aliases: ['setrole', 'giverole'],
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 3,
    usage: '<@membre> <@rôle> [add|remove]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Vous avez besoin de la permission "Gérer les rôles" pour utiliser cette commande.')] });
            }

            const targetMember = message.mentions.members.first();
            if (!targetMember) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre.\nUsage: `+rank @membre @rôle [add|remove]`')] });
            }

            const targetRole = message.mentions.roles.first();
            if (!targetRole) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un rôle.\nUsage: `+rank @membre @rôle [add|remove]`')] });
            }

            const action = args[2] ? args[2].toLowerCase() : 'add';
            if (!['add', 'remove'].includes(action)) {
                return message.reply({ embeds: [embeds.error('Action invalide. Utilisez `add` ou `remove`.')] });
            }

            if (targetRole.managed) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas gérer les rôles automatiques (bots, boosts, etc.).')] });
            }

            if (targetRole.position >= message.guild.members.me.roles.highest.position) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas gérer ce rôle (ma position est trop basse).')] });
            }

            const permissionCheck = RankPermissionService.canGiveRole(message.guild, message.member, targetRole.id);
            
            if (!permissionCheck.canGive) {
                return message.reply({ embeds: [embeds.error(`Vous ne pouvez pas donner ce rôle.\nRaison: ${permissionCheck.reason}`)] });
            }

            const color = ConfigService.getEmbedColor(message.guild.id);

            if (action === 'add') {
                if (targetMember.roles.cache.has(targetRole.id)) {
                    return message.reply({ embeds: [embeds.error(`${targetMember.user.tag} possède déjà le rôle ${targetRole.name}.`)] });
                }

                await targetMember.roles.add(targetRole);

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('✅ Rôle ajouté')
                    .setDescription(`Le rôle ${targetRole} a été ajouté à ${targetMember}`)
                    .addFields(
                        { name: 'Membre', value: `${targetMember.user.tag}`, inline: true },
                        { name: 'Rôle', value: `${targetRole.name}`, inline: true },
                        { name: 'Par', value: `${message.author.tag}`, inline: true }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                client.logger.command(`RANK ADD: ${targetRole.name} to ${targetMember.user.tag} by ${message.author.tag} in ${message.guild.id}`);

            } else if (action === 'remove') {
                if (!targetMember.roles.cache.has(targetRole.id)) {
                    return message.reply({ embeds: [embeds.error(`${targetMember.user.tag} ne possède pas le rôle ${targetRole.name}.`)] });
                }

                await targetMember.roles.remove(targetRole);

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('✅ Rôle retiré')
                    .setDescription(`Le rôle ${targetRole} a été retiré de ${targetMember}`)
                    .addFields(
                        { name: 'Membre', value: `${targetMember.user.tag}`, inline: true },
                        { name: 'Rôle', value: `${targetRole.name}`, inline: true },
                        { name: 'Par', value: `${message.author.tag}`, inline: true }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                client.logger.command(`RANK REMOVE: ${targetRole.name} from ${targetMember.user.tag} by ${message.author.tag} in ${message.guild.id}`);
            }

        } catch (err) {
            client.logger.error('Rank command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la modification du rôle.')] });
        }
    }
};

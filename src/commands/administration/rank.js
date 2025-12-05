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

            const isRemoval = action === 'remove';
            const permissionCheck = RankPermissionService.canGiveRole(message.guild, message.member, targetRole.id, targetMember, isRemoval);
            
            if (!permissionCheck.canGive) {
                return message.reply({ embeds: [embeds.error(`Vous ne pouvez pas ${isRemoval ? 'retirer' : 'donner'} ce rôle.\nRaison: ${permissionCheck.reason}`)] });
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

                const RANK_LOG_CHANNEL = '1440385056630771763';
                let logChannel = message.guild.channels.cache.get(RANK_LOG_CHANNEL);
                if (!logChannel) {
                    try {
                        logChannel = await message.guild.channels.fetch(RANK_LOG_CHANNEL);
                    } catch (err) {
                        client.logger.error('Error fetching rank log channel: ' + err.message);
                    }
                }
                if (logChannel) {
                    try {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('📊 Rôle Ajouté')
                            .setDescription(`${targetMember} a reçu le rôle ${targetRole}`)
                            .addFields(
                                { name: '👤 Membre', value: targetMember.user.tag, inline: true },
                                { name: '🎭 Rôle', value: targetRole.name, inline: true },
                                { name: '👮 Par', value: message.author.tag, inline: true }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });

                        const HIGH_ROLE_ID = '1434622694481072130';
                        const ALERT_ROLE_ID = '1434622673454891191';
                        const highRole = message.guild.roles.cache.get(HIGH_ROLE_ID);
                        if (highRole && targetRole.position > highRole.position) {
                            const alertEmbed = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('⚠️ ALERTE RANK SENSIBLE')
                                .setDescription(`<@&${ALERT_ROLE_ID}> Un rôle au-dessus de <@&${HIGH_ROLE_ID}> a été donné !`)
                                .addFields(
                                    { name: '👤 Membre', value: targetMember.toString(), inline: true },
                                    { name: '🎭 Rôle', value: targetRole.toString(), inline: true },
                                    { name: '👮 Par', value: message.author.tag, inline: true }
                                )
                                .setTimestamp();
                            await logChannel.send({ content: `<@&${ALERT_ROLE_ID}>`, embeds: [alertEmbed] });
                        }
                    } catch (err) {
                        client.logger.error('Error sending rank log: ' + err.message);
                    }
                }

            } else if (action === 'remove') {
                if (!targetMember.roles.cache.has(targetRole.id)) {
                    return message.reply({ embeds: [embeds.error(`${targetMember.user.tag} ne possède pas le rôle ${targetRole.name}.`)] });
                }

                const PROTECTED_ROLES = ['1434622710532542494', '1440401167166341212', '1440401243087568957'];
                const REQUIRED_ROLE_FOR_PROTECTED = '1434622673454891191';
                
                if (PROTECTED_ROLES.includes(targetRole.id)) {
                    const requiredRole = message.guild.roles.cache.get(REQUIRED_ROLE_FOR_PROTECTED);
                    if (!message.member.roles.cache.has(REQUIRED_ROLE_FOR_PROTECTED) && 
                        (!requiredRole || message.member.roles.highest.position <= requiredRole.position)) {
                        return message.reply({ embeds: [embeds.error(`Ce rôle est protégé ! Seuls <@&${REQUIRED_ROLE_FOR_PROTECTED}> ou supérieur peuvent le retirer.`)] });
                    }
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

                const RANK_LOG_CHANNEL = '1440385056630771763';
                let logChannel = message.guild.channels.cache.get(RANK_LOG_CHANNEL);
                if (!logChannel) {
                    try {
                        logChannel = await message.guild.channels.fetch(RANK_LOG_CHANNEL);
                    } catch (err) {
                        client.logger.error('Error fetching rank log channel: ' + err.message);
                    }
                }
                if (logChannel) {
                    try {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('📊 Rôle Retiré')
                            .setDescription(`${targetMember} a perdu le rôle ${targetRole}`)
                            .addFields(
                                { name: '👤 Membre', value: targetMember.user.tag, inline: true },
                                { name: '🎭 Rôle', value: targetRole.name, inline: true },
                                { name: '👮 Par', value: message.author.tag, inline: true }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });
                    } catch (err) {
                        client.logger.error('Error sending rank removal log: ' + err.message);
                    }
                }
            }

        } catch (err) {
            client.logger.error('Rank command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la modification du rôle.')] });
        }
    }
};

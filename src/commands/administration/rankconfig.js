const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const RankPermissionService = require('../../services/RankPermissionService');
const ConfigService = require('../../services/ConfigService');
const db = require('../../database/database');

module.exports = {
    name: 'rankconfig',
    description: 'Configurer les permissions de rank ou afficher les rôles disponibles',
    category: 'administration',
    aliases: ['rankperms', 'availableranks'],
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 5,
    usage: '[list] | [set @rôle @rôle1 @rôle2...]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const color = ConfigService.getEmbedColor(message.guild.id);
            const subcommand = args[0] ? args[0].toLowerCase() : 'list';

            if (subcommand === 'list' || !args[0]) {
                const availableRoles = RankPermissionService.getAvailableRolesToGive(message.guild, message.member);
                
                if (availableRoles.length === 0) {
                    return message.reply({ embeds: [embeds.error('Vous ne pouvez donner aucun rôle selon les permissions configurées.')] });
                }

                const rolesList = availableRoles
                    .map((role, index) => `${index + 1}. ${role} - \`${role.name}\``)
                    .join('\n');

                const chunks = [];
                const lines = rolesList.split('\n');
                let currentChunk = '';
                
                for (const line of lines) {
                    if ((currentChunk + line + '\n').length > 1024) {
                        chunks.push(currentChunk);
                        currentChunk = line + '\n';
                    } else {
                        currentChunk += line + '\n';
                    }
                }
                if (currentChunk) chunks.push(currentChunk);

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('🎭 Rôles que vous pouvez attribuer')
                    .setDescription(`Vous avez la permission de donner **${availableRoles.length}** rôle(s)`)
                    .setFooter({ text: `Utilisez +rank @membre @rôle pour attribuer un rôle` })
                    .setTimestamp();

                if (chunks.length > 0) {
                    chunks.forEach((chunk, index) => {
                        embed.addFields({ 
                            name: index === 0 ? 'Rôles disponibles' : `Rôles disponibles (suite ${index + 1})`, 
                            value: chunk,
                            inline: false
                        });
                    });
                }

                return message.reply({ embeds: [embed] });

            } else if (subcommand === 'set') {
                if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return message.reply({ embeds: [embeds.error('Seuls les administrateurs peuvent configurer les permissions personnalisées.')] });
                }

                const executorRole = message.mentions.roles.first();
                if (!executorRole) {
                    return message.reply({ embeds: [embeds.error('Veuillez mentionner le rôle qui aura les permissions.\nUsage: `+rankconfig set @roleExecutor @role1 @role2...`')] });
                }

                const allowedRoles = Array.from(message.mentions.roles.values()).slice(1);
                if (allowedRoles.length === 0) {
                    return message.reply({ embeds: [embeds.error('Veuillez mentionner au moins un rôle à autoriser.\nUsage: `+rankconfig set @roleExecutor @role1 @role2...`')] });
                }

                const allowedRoleIds = allowedRoles.map(r => r.id);
                db.setRankPermission(message.guild.id, executorRole.id, allowedRoleIds, 'custom', executorRole.position);

                RankPermissionService.clearCache();

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('✅ Permissions de rank configurées')
                    .setDescription(`Le rôle ${executorRole} peut maintenant donner les rôles suivants:`)
                    .addFields({ 
                        name: 'Rôles autorisés', 
                        value: allowedRoles.map(r => `• ${r}`).join('\n') || 'Aucun',
                        inline: false
                    })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                client.logger.command(`RANKCONFIG SET: ${executorRole.name} can give ${allowedRoles.length} roles by ${message.author.tag} in ${message.guild.id}`);

            } else if (subcommand === 'remove') {
                if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return message.reply({ embeds: [embeds.error('Seuls les administrateurs peuvent supprimer des permissions personnalisées.')] });
                }

                const executorRole = message.mentions.roles.first();
                if (!executorRole) {
                    return message.reply({ embeds: [embeds.error('Veuillez mentionner le rôle dont vous voulez supprimer les permissions.\nUsage: `+rankconfig remove @role`')] });
                }

                db.deleteRankPermission(message.guild.id, executorRole.id);
                RankPermissionService.clearCache();

                const embed = embeds.success(`Les permissions personnalisées du rôle ${executorRole} ont été supprimées.`, '✅ Permissions supprimées');
                await message.reply({ embeds: [embed] });
                client.logger.command(`RANKCONFIG REMOVE: ${executorRole.name} by ${message.author.tag} in ${message.guild.id}`);

            } else if (subcommand === 'view') {
                const allPermissions = db.getAllRankPermissions(message.guild.id);
                
                if (allPermissions.length === 0) {
                    return message.reply({ embeds: [embeds.error('Aucune permission personnalisée configurée.')] });
                }

                const permissionsList = allPermissions
                    .map((perm) => {
                        const role = message.guild.roles.cache.get(perm.role_id);
                        const allowedRoles = JSON.parse(perm.can_give_roles || '[]');
                        const allowedRoleNames = allowedRoles
                            .map(rid => {
                                const r = message.guild.roles.cache.get(rid);
                                return r ? `<@&${r.id}>` : `ID:${rid}`;
                            })
                            .join(', ');
                        
                        return `**${role ? role.name : perm.role_id}** → ${allowedRoleNames || 'Aucun'}`;
                    })
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('⚙️ Permissions personnalisées configurées')
                    .setDescription(permissionsList || 'Aucune')
                    .setTimestamp();

                return message.reply({ embeds: [embed] });

            } else {
                return message.reply({ embeds: [embeds.error('Sous-commande invalide. Utilisez: `list`, `set`, `remove`, ou `view`.')] });
            }

        } catch (err) {
            client.logger.error('Rankconfig command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des permissions de rank.')] });
        }
    }
};

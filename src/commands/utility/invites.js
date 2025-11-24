const embeds = require('../../utils/embeds');
const { ChannelType } = require('discord.js');

module.exports = {
    name: 'invites',
    description: 'Génère et affiche les liens d\'invitation pour tous les serveurs',
    category: 'utility',
    aliases: ['serverinvites', 'ginvites'],
    cooldown: 15,
    permissions: [],
    ownerOnly: true,
    
    async execute(message, args, client) {
        try {
            const guilds = client.guilds.cache;
            
            if (guilds.size === 0) {
                return message.reply({ embeds: [embeds.warning('Le bot n\'est dans aucun serveur.')] });
            }

            await message.reply({ embeds: [embeds.info('⏳ Génération des invitations en cours...', '🔗 Création des liens')] });

            const invitesList = [];
            let successCount = 0;
            let failCount = 0;

            for (const [guildId, guild] of guilds) {
                try {
                    const channel = guild.channels.cache.find(ch => 
                        ch.type === ChannelType.GuildText && 
                        ch.permissionsFor(guild.members.me).has('CreateInstantInvite')
                    );

                    if (!channel) {
                        invitesList.push(
                            `**${guild.name}**\n` +
                            `└ ID: \`${guild.id}\`\n` +
                            `└ ❌ Aucun canal accessible ou permission manquante\n`
                        );
                        failCount++;
                        continue;
                    }

                    const invite = await channel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                        unique: false,
                        reason: 'Génération d\'invitation via commande bot'
                    });

                    invitesList.push(
                        `**${guild.name}**\n` +
                        `└ ID: \`${guild.id}\`\n` +
                        `└ Membres: **${guild.memberCount}**\n` +
                        `└ 🔗 Lien: ${invite.url}\n`
                    );
                    successCount++;

                } catch (error) {
                    client.logger.error(`Erreur création invite pour ${guild.name}:`, error.message);
                    invitesList.push(
                        `**${guild.name}**\n` +
                        `└ ID: \`${guild.id}\`\n` +
                        `└ ❌ Erreur: ${error.message}\n`
                    );
                    failCount++;
                }
            }

            let description = `**✅ Succès: ${successCount} | ❌ Échec: ${failCount}**\n\n`;
            description += invitesList.join('\n');

            if (description.length > 4096) {
                const parts = [];
                let currentPart = `**✅ Succès: ${successCount} | ❌ Échec: ${failCount}**\n\n`;
                
                for (const invite of invitesList) {
                    if ((currentPart + invite).length > 4000) {
                        parts.push(currentPart);
                        currentPart = invite + '\n';
                    } else {
                        currentPart += invite + '\n';
                    }
                }
                
                if (currentPart.length > 0) {
                    parts.push(currentPart);
                }

                for (let i = 0; i < parts.length; i++) {
                    const embed = embeds.info(
                        parts[i],
                        `🔗 Liens d'invitation (${i + 1}/${parts.length})`,
                        {
                            footer: { text: `${client.user.tag} • Page ${i + 1}/${parts.length}` }
                        }
                    );
                    
                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                const embed = embeds.info(
                    description,
                    '🔗 Liens d\'invitation des serveurs',
                    {
                        footer: { text: `${client.user.tag} • ${guilds.size} serveur${guilds.size > 1 ? 's' : ''}` },
                        thumbnail: client.user.displayAvatarURL({ dynamic: true })
                    }
                );
                
                await message.channel.send({ embeds: [embed] });
            }
            
        } catch (error) {
            client.logger.error('Erreur invites:', error);
            await message.reply({ embeds: [embeds.error('Une erreur est survenue lors de la génération des invitations.')] });
        }
    }
};

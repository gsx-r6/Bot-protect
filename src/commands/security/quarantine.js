const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'quarantine',
    description: 'Mettre ou retirer un membre de la quarantaine',
    category: 'security',
    aliases: ['q', 'quar'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    usage: '<@membre> [raison]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            if (!member) {
                return message.reply({ embeds: [embeds.error('Membre introuvable. Utilisez `+quarantine @membre [raison]`')] });
            }

            if (member.id === message.author.id) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas vous mettre en quarantaine')] });
            }

            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas mettre en quarantaine ce membre (rôle supérieur ou égal)')] });
            }

            const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

            // Créer ou récupérer le rôle Quarantine
            let quarantineRole = message.guild.roles.cache.find(r => r.name === '🔒 Quarantine');

            if (!quarantineRole) {
                quarantineRole = await message.guild.roles.create({
                    name: '🔒 Quarantine',
                    color: '#FF0000',
                    permissions: [],
                    reason: 'Rôle de quarantaine'
                });

                // Configurer les permissions pour tous les salons
                for (const channel of message.guild.channels.cache.values()) {
                    if (channel.isTextBased() || channel.isVoiceBased()) {
                        await channel.permissionOverwrites.create(quarantineRole, {
                            ViewChannel: false,
                            SendMessages: false,
                            Connect: false
                        }).catch(() => { });
                    }
                }
            }

            // Vérifier si déjà en quarantaine
            const isQuarantined = member.roles.cache.has(quarantineRole.id);

            if (isQuarantined) {
                // Retirer de la quarantaine
                await member.roles.remove(quarantineRole, `Retiré par ${message.author.tag}: ${reason}`);

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Membre retiré de la Quarantaine')
                    .setDescription(`${member} a été retiré de la quarantaine`)
                    .addFields(
                        { name: '👤 Membre', value: `${member.user.tag}`, inline: true },
                        { name: '👮 Modérateur', value: `${message.author.tag}`, inline: true },
                        { name: '📝 Raison', value: reason, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                client.logger.command(`QUARANTINE removed: ${member.user.tag} by ${message.author.tag}`);

            } else {
                // Mettre en quarantaine
                await member.roles.add(quarantineRole, `Mis par ${message.author.tag}: ${reason}`);

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔒 Membre mis en Quarantaine')
                    .setDescription(`${member} a été mis en quarantaine`)
                    .addFields(
                        { name: '👤 Membre', value: `${member.user.tag}`, inline: true },
                        { name: '👮 Modérateur', value: `${message.author.tag}`, inline: true },
                        { name: '📝 Raison', value: reason, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                client.logger.command(`QUARANTINE applied: ${member.user.tag} by ${message.author.tag}`);

                // Envoyer DM au membre
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('🔒 Mise en Quarantaine')
                        .setDescription(`Vous avez été mis en quarantaine sur **${message.guild.name}**`)
                        .addFields(
                            { name: '📝 Raison', value: reason },
                            { name: '✅ Que faire ?', value: 'Contactez un modérateur pour être vérifié.' }
                        );

                    await member.send({ embeds: [dmEmbed] });
                } catch (e) {
                    // Ignore si DMs fermés
                }
            }

        } catch (err) {
            client.logger.error('Quarantine command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la mise en quarantaine')] });
        }
    }
};

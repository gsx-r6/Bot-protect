const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setverification',
    description: 'Configurer le système de vérification',
    category: 'administration',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '<role> [#salon] [message]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
            const channel = message.mentions.channels.first() || message.channel;
            const customMessage = args.slice(role ? 1 : 0).filter(arg => !arg.startsWith('<#') && !arg.startsWith('<@&')).join(' ');

            if (!role) {
                return message.reply({ embeds: [embeds.error('Veuillez spécifier un rôle de vérification.\nUsage: `+setverification @Role #salon [message]`')] });
            }

            ConfigService.setGuildConfig(message.guild.id, 'verify_role_id', role.id);
            ConfigService.setVerifyChannel(message.guild.id, channel.id);
            if (customMessage) ConfigService.setGuildConfig(message.guild.id, 'verify_message', customMessage);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_user')
                        .setLabel('Se vérifier')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅')
                );

            const embed = embeds.success(
                customMessage || "Cliquez sur le bouton ci-dessous pour accéder au reste du serveur.",
                '🛡️ Système de Vérification'
            );

            await channel.send({ embeds: [embed], components: [row] });

            return message.reply({ embeds: [embeds.success(`Système de vérification configuré !\nSalon: ${channel}\nRôle: ${role}`)] });
        } catch (err) {
            client.logger.error('Setverification error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration.')] });
        }
    }
};

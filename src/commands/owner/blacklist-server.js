const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'blacklist-server',
    description: 'Retirer l\'autorisation d\'un serveur et le quitter (Owner only)',
    category: 'owner',
    aliases: ['bls', 'remove-server'],
    ownerOnly: true,
    cooldown: 0,
    usage: '<server_id>',

    async execute(message, args, client) {
        try {
            // Vérifier que c'est l'owner
            if (message.author.id !== (process.env.OWNER_ID || client.config.OWNER_ID)) {
                return message.reply({ embeds: [embeds.error('Cette commande est réservée à l\'owner du bot')] });
            }

            if (!args[0]) {
                return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID du serveur.\nUtilisation: `+blacklist-server <server_id>`')] });
            }

            const serverId = args[0];

            // Charger le module guildCreate pour accéder à la whitelist
            const guildCreateEvent = require('../../events/guild/guildCreate');
            const whitelist = guildCreateEvent.WHITELISTED_SERVERS;

            // Vérifier si whitelisté
            if (!whitelist.has(serverId)) {
                return message.reply({ embeds: [embeds.warning(`Le serveur \`${serverId}\` n'est pas dans la whitelist.`)] });
            }

            // Retirer de la whitelist
            whitelist.delete(serverId);

            // Essayer de quitter le serveur si le bot y est
            let leftGuild = false;
            let guildName = 'Serveur inconnu';
            try {
                const guild = await client.guilds.fetch(serverId);
                guildName = guild.name;
                await guild.leave();
                leftGuild = true;
            } catch (e) {
                // Le bot n'est pas sur ce serveur
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Serveur Retiré')
                .setDescription(`Le serveur a été retiré de la whitelist !`)
                .addFields(
                    { name: '🆔 ID', value: serverId, inline: true },
                    { name: '📝 Serveur', value: guildName, inline: true },
                    { name: '🚪 Quitté', value: leftGuild ? 'Oui' : 'Non (pas sur ce serveur)', inline: true },
                    { name: '📊 Total autorisés', value: `${whitelist.size}`, inline: true }
                )
                .setFooter({ text: 'Le bot quittera automatiquement si réinvité' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`SERVER BLACKLISTED by ${message.author.tag}: ${serverId}`);

        } catch (err) {
            client.logger.error('Blacklist-server command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du retrait du serveur')] });
        }
    }
};

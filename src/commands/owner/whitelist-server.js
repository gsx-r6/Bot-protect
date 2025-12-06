const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'whitelist-server',
    description: 'Autoriser un serveur à utiliser le bot (Owner only)',
    category: 'owner',
    aliases: ['wls', 'authorize-server'],
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
                return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID du serveur.\nUtilisation: `+whitelist-server <server_id>`')] });
            }

            const serverId = args[0];

            // Charger le module guildCreate pour accéder à la whitelist
            const guildCreateEvent = require('../../events/guild/guildCreate');
            const whitelist = guildCreateEvent.WHITELISTED_SERVERS;

            // Vérifier si déjà whitelisté
            if (whitelist.has(serverId)) {
                return message.reply({ embeds: [embeds.warning(`Le serveur \`${serverId}\` est déjà autorisé.`)] });
            }

            // Ajouter à la whitelist
            whitelist.add(serverId);

            // Essayer de récupérer les infos du serveur
            let guildInfo = 'Serveur inconnu (le bot n\'est pas encore dedans)';
            try {
                const guild = await client.guilds.fetch(serverId);
                guildInfo = `**${guild.name}** (${guild.memberCount} membres)`;
            } catch (e) {
                // Serveur pas encore rejoint
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Serveur Autorisé')
                .setDescription(`Le serveur a été ajouté à la whitelist !`)
                .addFields(
                    { name: '🆔 ID', value: serverId, inline: true },
                    { name: '📝 Serveur', value: guildInfo, inline: true },
                    { name: '📊 Total autorisés', value: `${whitelist.size}`, inline: true }
                )
                .setFooter({ text: 'Le bot peut maintenant rester sur ce serveur' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`SERVER WHITELISTED by ${message.author.tag}: ${serverId}`);

        } catch (err) {
            client.logger.error('Whitelist-server command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'autorisation du serveur')] });
        }
    }
};

const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'servers',
    description: 'Lister tous les serveurs du bot (Owner only)',
    category: 'owner',
    aliases: ['serverlist', 'guilds'],
    ownerOnly: true,
    cooldown: 5,
    usage: '',

    async execute(message, args, client) {
        try {
            // Vérifier que c'est l'owner
            if (message.author.id !== (process.env.OWNER_ID || client.config.OWNER_ID)) {
                return message.reply({ embeds: [embeds.error('Cette commande est réservée à l\'owner du bot')] });
            }

            // Charger la whitelist
            const guildCreateEvent = require('../../events/guild/guildCreate');
            const whitelist = guildCreateEvent.WHITELISTED_SERVERS;

            const guilds = client.guilds.cache;
            const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📊 Liste des Serveurs')
                .setDescription(`Le bot est sur **${guilds.size}** serveur(s) avec **${totalMembers}** membres au total.`)
                .setFooter({ text: `✅ ${whitelist.size} serveur(s) autorisé(s)` })
                .setTimestamp();

            // Lister les serveurs (max 25 pour éviter de dépasser la limite d'embed)
            const guildsList = guilds.sort((a, b) => b.memberCount - a.memberCount).first(25);

            for (const guild of guildsList) {
                const isWhitelisted = whitelist.has(guild.id);
                const status = isWhitelisted ? '✅' : '⚠️';

                embed.addFields({
                    name: `${status} ${guild.name}`,
                    value: `ID: \`${guild.id}\`\n👥 ${guild.memberCount} membres\n👑 <@${guild.ownerId}>`,
                    inline: true
                });
            }

            if (guilds.size > 25) {
                embed.addFields({
                    name: '📋 Note',
                    value: `${guilds.size - 25} serveur(s) supplémentaire(s) non affiché(s)`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
            client.logger.command(`SERVERS listed by ${message.author.tag}`);

        } catch (err) {
            client.logger.error('Servers command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération des serveurs')] });
        }
    }
};

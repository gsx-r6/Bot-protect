const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');
const PermissionHandler = require('../../utils/PermissionHandler');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        // Ignorer si l'utilisateur a la permission de gérer les messages ou est admin
        if (message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
            message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        // Vérifier si l'anti-link est activé pour ce serveur
        const config = db.getGuildConfig(message.guild.id); // On suppose que c'est dans guild_config ou automod_config
        // Note: La table automod_config existe, on va l'utiliser.
        // Il faut une méthode pour récupérer automod_config. Si elle n'existe pas dans db, je devrai l'ajouter ou faire une requête directe.
        // Pour l'instant, je vais utiliser une méthode générique ou supposer qu'elle existe/je vais l'ajouter.

        // Vérification rapide via DB (je vais ajouter la méthode getAutomodConfig dans database.js si elle n'y est pas, mais je vais assumer qu'elle est accessible via une requête raw si besoin, ou mieux, je vais l'ajouter proprement).
        // En attendant, je vais utiliser db.db.prepare directement si la méthode n'existe pas, mais c'est sale.
        // Je vais vérifier database.js à nouveau. Il n'y a pas de getAutomodConfig. Je vais devoir l'ajouter.

        // Mais pour ce fichier, je vais écrire le code en supposant que db.getAutomodConfig existe, et je mettrai à jour database.js juste après.

        const automod = db.getAutomodConfig ? db.getAutomodConfig(message.guild.id) : null;

        if (!automod || !automod.antilink) return;

        // Regex pour les invitations Discord
        const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/gi;
        // Regex pour les liens HTTP (si on veut être strict, mais souvent on veut juste les invites)
        // Le client a demandé "Anti-Link", souvent ça inclut tout lien pour éviter les pubs.
        // Je vais cibler les invitations Discord en priorité, et les liens http génériques si configuré (optionnel).
        // Pour l'instant, focus sur les invitations Discord qui sont le fléau principal.

        const isInvite = inviteRegex.test(message.content);

        // Regex pour tout lien http/https
        const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
        const isLink = linkRegex.test(message.content);

        if (isInvite || isLink) {
            // On supprime
            try {
                if (message.deletable) {
                    await message.delete();

                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`🚫 **${message.author}, les liens ne sont pas autorisés ici.**`)
                        .setFooter({ text: 'Nami Protect 🛡️' });

                    const msg = await message.channel.send({ embeds: [embed] });
                    setTimeout(() => msg.delete().catch(() => { }), 5000);

                    client.logger.info(`AntiLink: Link deleted from ${message.author.tag} in ${message.guild.name}`);
                }
            } catch (err) {
                client.logger.error(`AntiLink Error: ${err.message}`);
            }
        }
    }
};

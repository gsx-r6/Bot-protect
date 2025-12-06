const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

// Whitelist des serveurs autorisés (IDs)
// Pour autoriser un serveur, ajoutez son ID ici ou utilisez la commande +whitelist-server
const WHITELISTED_SERVERS = new Set([
    // Ajoutez les IDs de serveurs autorisés ici
    // Exemple: '1234567890123456789'
]);

module.exports = {
    name: Events.GuildCreate,
    once: false,

    async execute(guild, client) {
        try {
            logger.info(`➕ Bot ajouté au serveur: ${guild.name} (${guild.id})`);
            logger.info(`👥 Membres: ${guild.memberCount} | 👑 Owner: ${guild.ownerId}`);

            // Vérifier si le serveur est whitelisté
            if (!WHITELISTED_SERVERS.has(guild.id)) {
                logger.warn(`⚠️ Serveur NON AUTORISÉ: ${guild.name} (${guild.id})`);

                // Envoyer un message à l'owner du bot
                const owner = await client.users.fetch(process.env.OWNER_ID || client.config.OWNER_ID);
                if (owner) {
                    const embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('⚠️ Nouveau Serveur Non Autorisé')
                        .setDescription(`Le bot a été ajouté à un serveur non whitelisté et l'a quitté automatiquement.`)
                        .addFields(
                            { name: '📝 Nom', value: guild.name, inline: true },
                            { name: '🆔 ID', value: guild.id, inline: true },
                            { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
                            { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                            { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                            { name: '✅ Pour autoriser', value: `\`+whitelist-server ${guild.id}\``, inline: false }
                        )
                        .setThumbnail(guild.iconURL() || null)
                        .setTimestamp();

                    await owner.send({ embeds: [embed] }).catch(() => {
                        logger.error('Impossible d\'envoyer un DM à l\'owner');
                    });
                }

                // Envoyer un message au serveur avant de partir
                try {
                    const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased());
                    if (systemChannel) {
                        const leaveEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🚫 Accès Non Autorisé')
                            .setDescription(`Ce bot est **privé** et nécessite une autorisation de l'owner pour rejoindre un serveur.\n\nContactez <@${process.env.OWNER_ID || client.config.OWNER_ID}> pour demander l'accès.`)
                            .setFooter({ text: 'Le bot va quitter ce serveur automatiquement' })
                            .setTimestamp();

                        await systemChannel.send({ embeds: [leaveEmbed] });
                    }
                } catch (e) {
                    logger.error('Impossible d\'envoyer un message au serveur:', e.message);
                }

                // Quitter le serveur après 5 secondes
                setTimeout(async () => {
                    await guild.leave();
                    logger.info(`❌ Bot quitté du serveur non autorisé: ${guild.name}`);
                }, 5000);

                return;
            }

            // Serveur autorisé
            logger.success(`✅ Serveur AUTORISÉ: ${guild.name} (${guild.id})`);

            // Envoyer un message de bienvenue à l'owner du bot
            const owner = await client.users.fetch(process.env.OWNER_ID || client.config.OWNER_ID);
            if (owner) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Bot Ajouté à un Serveur Autorisé')
                    .setDescription(`Le bot a été ajouté avec succès !`)
                    .addFields(
                        { name: '📝 Nom', value: guild.name, inline: true },
                        { name: '🆔 ID', value: guild.id, inline: true },
                        { name: '👥 Membres', value: `${guild.memberCount}`, inline: true }
                    )
                    .setThumbnail(guild.iconURL() || null)
                    .setTimestamp();

                await owner.send({ embeds: [embed] }).catch(() => { });
            }

            // Message de bienvenue dans le serveur
            try {
                const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased());
                if (systemChannel) {
                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('👋 Merci de m\'avoir ajouté !')
                        .setDescription(`Je suis **{+} uhq Monde**, un bot de protection et modération avancé.\n\nUtilisez \`+help\` pour voir toutes mes commandes !`)
                        .addFields(
                            { name: '🛡️ Protection', value: 'Anti-Raid, Lockdown, Quarantine', inline: true },
                            { name: '💾 Backup', value: 'Sauvegarde complète du serveur', inline: true },
                            { name: '⚡ Modération', value: 'Mass Actions, Auto-Mod', inline: true }
                        )
                        .setFooter({ text: 'Configurez-moi avec +setup' })
                        .setTimestamp();

                    await systemChannel.send({ embeds: [welcomeEmbed] });
                }
            } catch (e) {
                logger.error('Impossible d\'envoyer le message de bienvenue:', e.message);
            }

        } catch (error) {
            logger.error('[GuildCreate] Erreur:', error);
        }
    }
};

// Exporter la whitelist pour modification via commande
module.exports.WHITELISTED_SERVERS = WHITELISTED_SERVERS;

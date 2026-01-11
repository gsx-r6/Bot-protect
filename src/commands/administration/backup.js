const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BackupService = require('../../services/BackupService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'backup',
    description: 'Système de gestion des sauvegardes du serveur',
    category: 'administration',
    aliases: ['sauvegarde'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    usage: '<create|list|load> [nom_du_fichier]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const subCommand = args[0]?.toLowerCase();

            // Menu d'aide si aucun argument ou argument invalide
            if (!subCommand || !['create', 'list', 'load'].includes(subCommand)) {
                const helpEmbed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle('💾 Gestion des Backups')
                    .setDescription('Utilisez les sous-commandes suivantes pour gérer les sauvegardes :')
                    .addFields(
                        { name: '✨ `+backup create`', value: 'Créer une nouvelle sauvegarde complète du serveur.' },
                        { name: '📋 `+backup list`', value: 'Afficher la liste de tous les backups disponibles.' },
                        { name: '📥 `+backup load <nom>`', value: 'Restaurer le serveur depuis un fichier de backup.' }
                    )
                    .setFooter({ text: 'Prudence : La restauration est une action lourde.' });
                return message.reply({ embeds: [helpEmbed] });
            }

            // --- CREATE ---
            if (subCommand === 'create') {
                const loadingMsg = await message.reply({ embeds: [embeds.info('⏳ Création du backup en cours... Cela peut prendre quelques minutes.')] });
                const result = await BackupService.createBackup(message.guild);

                if (!result.success) {
                    return loadingMsg.edit({ embeds: [embeds.error(`Erreur lors de la création du backup: ${result.error}`)] });
                }

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Backup Créé avec Succès')
                    .addFields(
                        { name: '📁 Fichier', value: `\`${result.filename}\``, inline: false },
                        { name: '📊 Statistiques', value: `🎭 ${result.backup.roles.length} rôles\n📺 ${result.backup.channels.length + result.backup.categories.length} salons\n😀 ${result.backup.emojis.length} emojis` },
                        { name: '💡 Info', value: `Pour restaurer : \`+backup load ${result.filename}\`` }
                    )
                    .setTimestamp();
                return loadingMsg.edit({ embeds: [embed] });
            }

            // --- LIST ---
            if (subCommand === 'list') {
                const backups = BackupService.listBackups(message.guild.id);
                if (backups.length === 0) {
                    return message.reply({ embeds: [embeds.info('Aucun backup trouvé pour ce serveur.\nUtilisez `+backup create` pour en créer un.')] });
                }

                const embed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle(`💾 Backups de ${message.guild.name}`)
                    .setDescription(`**${backups.length}** disponible(s). Utilisez \`+backup load <nom>\` pour restaurer.`)
                    .setTimestamp();

                backups.slice(0, 10).forEach(b => {
                    const date = new Date(b.createdAt).toLocaleString('fr-FR');
                    embed.addFields({
                        name: `📁 ${b.filename}`,
                        value: `📅 ${date} | 📊 Roles: ${b.roles}, Salons: ${b.channels} | 💾 ${(b.size / 1024).toFixed(2)} KB`
                    });
                });

                return message.reply({ embeds: [embed] });
            }

            // --- LOAD (Restore) ---
            if (subCommand === 'load') {
                const filename = args[1];
                if (!filename) {
                    return message.reply({ embeds: [embeds.error('Veuillez spécifier le nom du fichier de backup.\nUtilisez `+backup list` pour les voir.')] });
                }

                const confirmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Confirmation Requise')
                    .setDescription(`**ATTENTION:** La restauration va recréer les salons et rôles.\n\n**Fichier:** \`${filename}\`\n\nRépondez \`confirmer\` dans les 30 secondes pour continuer.`)
                    .setFooter({ text: 'Action irréversible' });

                const confirmMsg = await message.reply({ embeds: [confirmEmbed] });

                const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'confirmer';
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => null);

                if (!collected) {
                    return confirmMsg.edit({ embeds: [embeds.error('Restauration annulée (timeout ou mauvaise réponse)')] });
                }

                const loadingMsg = await message.reply({ embeds: [embeds.info('⏳ Restauration en cours... Veuillez patienter.')] });
                const result = await BackupService.restoreBackup(message.guild, filename);

                if (!result.success) {
                    return loadingMsg.edit({ embeds: [embeds.error(`Erreur: ${result.error}`)] });
                }

                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Restauration Terminée')
                    .setDescription(`Le serveur a été restauré depuis \`${filename}\``)
                    .addFields(
                        { name: '🎭 Rôles', value: `✅ ${result.results.roles.created} | ❌ ${result.results.roles.failed}`, inline: true },
                        { name: '📺 Salons', value: `✅ ${result.results.channels.created} | ❌ ${result.results.channels.failed}`, inline: true }
                    );
                return loadingMsg.edit({ embeds: [successEmbed] });
            }

        } catch (err) {
            client.logger.error('Backup command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Une erreur est survenue lors de l\'opération de backup.')] });
        }
    }
};

const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BackupService = require('../../services/BackupService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'backup',
    description: 'Créer un backup complet du serveur',
    category: 'administration',
    aliases: ['save', 'sauvegarde'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 60,
    usage: '',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const loadingMsg = await message.reply({ embeds: [embeds.info('⏳ Création du backup en cours... Cela peut prendre quelques minutes.')] });

            const result = await BackupService.createBackup(message.guild);

            if (!result.success) {
                return loadingMsg.edit({ embeds: [embeds.error(`Erreur lors de la création du backup: ${result.error}`)] });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Backup Créé avec Succès')
                .setDescription(`Le backup de **${message.guild.name}** a été créé`)
                .addFields(
                    { name: '📁 Fichier', value: `\`${result.filename}\``, inline: false },
                    { name: '🎭 Rôles sauvegardés', value: `${result.backup.roles.length}`, inline: true },
                    { name: '📺 Salons sauvegardés', value: `${result.backup.channels.length + result.backup.categories.length}`, inline: true },
                    { name: '😀 Emojis sauvegardés', value: `${result.backup.emojis.length}`, inline: true },
                    { name: '💾 Utilisation', value: `Pour restaurer: \`+restore ${result.filename}\``, inline: false }
                )
                .setFooter({ text: 'Les 7 derniers backups sont conservés automatiquement' })
                .setTimestamp();

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`BACKUP created by ${message.author.tag} in ${message.guild.name}`);

        } catch (err) {
            client.logger.error('Backup command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la création du backup')] });
        }
    }
};

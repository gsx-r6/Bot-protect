const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BackupService = require('../../services/BackupService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'restore',
    description: 'Restaurer le serveur depuis un backup',
    category: 'administration',
    aliases: ['restaurer'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 120,
    usage: '<nom_fichier> [options]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            if (!args[0]) {
                return message.reply({ embeds: [embeds.error('Veuillez spécifier le nom du fichier de backup.\nUtilisez `+backups` pour voir la liste.')] });
            }

            const filename = args[0];

            // Confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Confirmation Requise')
                .setDescription(`**ATTENTION:** La restauration va créer de nouveaux rôles et salons.\n\n**Fichier:** \`${filename}\`\n\nRépondez \`confirmer\` dans les 30 secondes pour continuer.`)
                .setFooter({ text: 'Cette action est irréversible' });

            await message.reply({ embeds: [confirmEmbed] });

            const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'confirmer';
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .catch(() => null);

            if (!collected) {
                return message.reply({ embeds: [embeds.error('Restauration annulée (timeout)')] });
            }

            const loadingMsg = await message.reply({ embeds: [embeds.info('⏳ Restauration en cours... Cela peut prendre plusieurs minutes.')] });

            const result = await BackupService.restoreBackup(message.guild, filename);

            if (!result.success) {
                return loadingMsg.edit({ embeds: [embeds.error(`Erreur lors de la restauration: ${result.error}`)] });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Restauration Terminée')
                .setDescription(`Le serveur a été restauré depuis \`${filename}\``)
                .addFields(
                    { name: '🎭 Rôles', value: `✅ ${result.results.roles.created} | ❌ ${result.results.roles.failed}`, inline: true },
                    { name: '📺 Salons', value: `✅ ${result.results.channels.created} | ❌ ${result.results.channels.failed}`, inline: true },
                    { name: '😀 Emojis', value: `✅ ${result.results.emojis.created} | ❌ ${result.results.emojis.failed}`, inline: true }
                )
                .setTimestamp();

            await loadingMsg.edit({ embeds: [embed] });
            client.logger.command(`RESTORE executed by ${message.author.tag} in ${message.guild.name}`);

        } catch (err) {
            client.logger.error('Restore command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la restauration')] });
        }
    }
};

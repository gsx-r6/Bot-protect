const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BackupService = require('../../services/BackupService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'backups',
    description: 'Lister tous les backups du serveur',
    category: 'administration',
    aliases: ['listbackups', 'sauvegardes'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    usage: '',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const backups = BackupService.listBackups(message.guild.id);

            if (backups.length === 0) {
                return message.reply({ embeds: [embeds.info('Aucun backup trouvé pour ce serveur.\nUtilisez `+backup` pour en créer un.')] });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(`💾 Backups de ${message.guild.name}`)
                .setDescription(`**${backups.length}** backup(s) disponible(s)`)
                .setFooter({ text: 'Utilisez +restore <fichier> pour restaurer' })
                .setTimestamp();

            for (const backup of backups.slice(0, 10)) {
                const date = new Date(backup.createdAt);
                const size = (backup.size / 1024).toFixed(2);

                embed.addFields({
                    name: `📁 ${backup.filename}`,
                    value: [
                        `📅 **Date:** ${date.toLocaleString('fr-FR')}`,
                        `📊 **Contenu:** ${backup.roles} rôles, ${backup.channels} salons, ${backup.emojis} emojis`,
                        `💾 **Taille:** ${size} KB`
                    ].join('\n'),
                    inline: false
                });
            }

            if (backups.length > 10) {
                embed.addFields({
                    name: '📋 Note',
                    value: `${backups.length - 10} backup(s) supplémentaire(s) non affiché(s)`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
            client.logger.command(`BACKUPS listed by ${message.author.tag}`);

        } catch (err) {
            client.logger.error('Backups command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la récupération des backups')] });
        }
    }
};

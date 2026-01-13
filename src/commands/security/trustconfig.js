const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'trustconfig',
    description: 'Configurer les seuils du TrustScore',
    category: 'security',
    usage: '<links/media/quarantine> <valeur>',
    permissions: [PermissionsBitField.Flags.Administrator],
    cooldown: 5,

    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ embeds: [embeds.error('Permission insuffisante (Admin requis)')] });
        }

        const guildId = message.guild.id;
        const color = ConfigService.getEmbedColor(guildId);
        const subCommand = args[0]?.toLowerCase();

        const currentConfig = db.getTrustConfig(guildId) || {
            min_score_link: 30,
            min_score_media: 20,
            quarantine_threshold: 10
        };

        if (!subCommand) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('⚙️ Configuration TrustScore')
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '🔗 Liens (Score min)', value: `\`${currentConfig.min_score_link}\``, inline: true },
                    { name: '🖼️ Médias (Score min)', value: `\`${currentConfig.min_score_media}\``, inline: true },
                    { name: '☣️ Quarantaine (Seuil)', value: `\`${currentConfig.quarantine_threshold}\``, inline: true }
                )
                .setDescription(`Utilisation : \`+trustconfig <links|media|quarantine> <0-100>\``)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        const value = parseInt(args[1]);
        if (isNaN(value) || value < 0 || value > 100) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir un score valide entre 0 et 100.')] });
        }

        let key;
        let label;

        switch (subCommand) {
            case 'links':
            case 'link':
            case 'liens':
                key = 'min_score_link';
                label = 'Score minimal pour les liens';
                break;
            case 'media':
            case 'images':
            case 'medias':
                key = 'min_score_media';
                label = 'Score minimal pour les médias';
                break;
            case 'quarantine':
            case 'seuil':
                key = 'quarantine_threshold';
                label = 'Seuil de quarantaine automatique';
                break;
            default:
                return message.reply({ embeds: [embeds.error('Sous-commande invalide. Utilisez : `links`, `media` ou `quarantine`.')] });
        }

        db.setTrustConfig(guildId, key, value);

        const successEmbed = new EmbedBuilder()
            .setColor('#a6e3a1')
            .setTitle('✅ Configuration Mise à Jour')
            .setDescription(`Le paramètre **${label}** a été défini sur **${value}**.`)
            .setTimestamp();

        client.logger.command(`TRUSTCONFIG: ${key} set to ${value} by ${message.author.tag}`);
        return message.reply({ embeds: [successEmbed] });
    }
};

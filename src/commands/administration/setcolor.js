const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

const PRESET_COLORS = {
    'bleu': '#3498db',
    'rouge': '#e74c3c',
    'vert': '#2ecc71',
    'jaune': '#f1c40f',
    'violet': '#9b59b6',
    'orange': '#e67e22',
    'rose': '#FF69B4',
    'cyan': '#1abc9c',
    'blanc': '#ecf0f1',
    'noir': '#2c3e50',
    'or': '#f39c12',
    'argent': '#95a5a6'
};

module.exports = {
    name: 'setcolor',
    description: 'Personnaliser la couleur des embeds du bot',
    category: 'administration',
    aliases: ['setcolour', 'couleur', 'color'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '[couleur hex ou nom]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            if (!args[0]) {
                const currentColor = ConfigService.getEmbedColor(message.guild.id);
                const presetList = Object.keys(PRESET_COLORS).map(name => `\`${name}\``).join(', ');
                
                const embed = new EmbedBuilder()
                    .setColor(currentColor)
                    .setTitle('🎨 Couleur des Embeds')
                    .setDescription(`Couleur actuelle: **${currentColor}**`)
                    .addFields(
                        { name: '💡 Usage', value: '`+setcolor <couleur>`\nExemple: `+setcolor #FF5733` ou `+setcolor rose`', inline: false },
                        { name: '🎨 Couleurs prédéfinies', value: presetList, inline: false }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            let color = args[0].toLowerCase();
            
            if (PRESET_COLORS[color]) {
                color = PRESET_COLORS[color];
            } else if (!color.startsWith('#')) {
                color = '#' + color;
            }

            if (!/^#[0-9A-F]{6}$/i.test(color)) {
                return message.reply({ embeds: [embeds.error('Format de couleur invalide. Utilisez un code hex (#FF5733) ou un nom de couleur prédéfini.')] });
            }

            ConfigService.setEmbedColor(message.guild.id, color);

            const testEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('✅ Couleur mise à jour')
                .setDescription(`La nouvelle couleur des embeds est: **${color}**`)
                .addFields({ name: '🎨 Aperçu', value: 'Voici à quoi ressembleront les embeds du bot désormais!' })
                .setFooter({ text: `Configuré par ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [testEmbed] });
            client.logger.command(`SETCOLOR: ${color} by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setcolor command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors du changement de couleur.')] });
        }
    }
};

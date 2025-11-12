const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'setup',
    description: 'Guide de configuration rapide du bot',
    category: 'administration',
    aliases: ['quicksetup', 'configure'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    usage: '',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            const prefix = ConfigService.getPrefix(message.guild.id);
            const color = ConfigService.getEmbedColor(message.guild.id);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🚀 Guide de Configuration Rapide')
                .setDescription(`Bienvenue dans l'assistant de configuration de **${client.user.username}** !\n\nVoici les étapes pour configurer votre bot :`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: '1️⃣ Configuration Générale',
                        value: [
                            `• \`${prefix}setprefix <nouveau préfixe>\` - Changer le préfixe`,
                            `• \`${prefix}setcolor <couleur>\` - Personnaliser les couleurs`,
                            `• \`${prefix}autorole @rôle\` - Configurer l'auto-rôle`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '2️⃣ Messages & Bienvenue',
                        value: [
                            `• \`${prefix}setwelcome #salon [message]\` - Message de bienvenue`,
                            `• \`${prefix}setgoodbye #salon [message]\` - Message d'au revoir`,
                            `• \`${prefix}setverif #salon\` - Salon de vérification`,
                            `\n**Variables:** \`{user}\` \`{server}\` \`{count}\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '3️⃣ Logs & Modération',
                        value: [
                            `• \`${prefix}setlogs #salon\` - Logs généraux`,
                            `• \`${prefix}setmodlogs #salon\` - Logs de modération`,
                            `• \`${prefix}joinlog on\` - Activer les logs de join`,
                            `• \`${prefix}leavelog on\` - Activer les logs de leave`,
                            `• \`${prefix}messagelog on\` - Activer les logs de messages`,
                            `• \`${prefix}voicelog on\` - Activer les logs vocaux`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '4️⃣ Sécurité & Protection',
                        value: [
                            `• \`${prefix}antispam on\` - Protection anti-spam`,
                            `• \`${prefix}antilink on\` - Bloquer les liens`,
                            `• \`${prefix}antiraid on\` - Protection anti-raid`,
                            `• \`${prefix}antibot on\` - Bloquer les bots non autorisés`,
                            `• \`${prefix}security-check\` - Audit de sécurité`,
                            `\n⚡ **Recommandé:** Activez toutes les protections`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '5️⃣ Statistiques (Optionnel)',
                        value: [
                            `• \`${prefix}setup-stats\` - Créer des salons de stats vocaux`,
                            `Affiche le nombre de membres, en ligne, et en vocal en temps réel`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '✅ Configuration Terminée ?',
                        value: [
                            `• \`${prefix}config\` - Voir toute la configuration`,
                            `• \`${prefix}dashboard\` - Panel de contrôle complet`,
                            `• \`${prefix}help\` - Liste de toutes les commandes`,
                            `\n💡 **Besoin d'aide ?** Utilisez \`${prefix}support\``
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Configuration de ${message.guild.name} • Utilisez ${prefix}config pour voir l'état actuel`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`SETUP viewed by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Setup command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage du guide de configuration.')] });
        }
    }
};

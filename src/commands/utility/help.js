const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');
const ConfigService = require('../../services/ConfigService');

const CATEGORY_CONFIG = {
    'administration': { emoji: '⚙️', label: 'Administration', description: 'Gestion du serveur et configuration' },
    'moderation': { emoji: '🛡️', label: 'Modération', description: 'Outils de sanction et de contrôle' },
    'security': { emoji: '🔒', label: 'Sécurité', description: 'Anti-raid, anti-spam et protections' },
    'logging': { emoji: '📝', label: 'Logs', description: 'Journaux d\'audit et surveillance' },
    'utility': { emoji: '🔧', label: 'Utilitaire', description: 'Outils pratiques et divers' },
    'information': { emoji: 'ℹ️', label: 'Information', description: 'Informations sur le serveur et le bot' },
    'system': { emoji: '🔐', label: 'Système', description: 'Commandes système et debug' },
    'staff': { emoji: '👥', label: 'Staff', description: 'Commandes réservées à l\'équipe' }
};

module.exports = {
    name: 'help',
    description: 'Centre d\'aide interactif et liste des commandes',
    category: 'utility',
    aliases: ['h', 'aide', 'menu'],
    cooldown: 5,
    usage: '[commande]',

    async execute(message, args, client) {
        try {
            const prefix = ConfigService.getPrefix(message.guild.id);
            const color = ConfigService.getEmbedColor(message.guild.id);

            // Si un argument est fourni, afficher l'aide spécifique de la commande
            if (args[0]) {
                return this.showCommandHelp(message, args[0], client, prefix, color);
            }

            // --- MENU PRINCIPAL INTERACTIF ---

            // 1. Préparer les catégories
            const categories = new Set();
            client.commands.forEach(cmd => {
                if (cmd.category && cmd.category !== 'owner') {
                    categories.add(cmd.category);
                }
            });

            // 2. Créer le Select Menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Choisir une catégorie...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Accueil')
                        .setDescription('Retour à la page d\'accueil')
                        .setValue('home')
                        .setEmoji('🏠')
                );

            // Trier et ajouter les options
            const sortedCategories = Array.from(categories).sort();
            sortedCategories.forEach(cat => {
                const config = CATEGORY_CONFIG[cat] || { emoji: '📁', label: cat, description: 'Commandes diverses' };
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(config.label)
                        .setDescription(config.description)
                        .setValue(cat)
                        .setEmoji(config.emoji)
                );
            });

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // 3. Créer l'Embed d'Accueil
            const homeEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`⚡ Centre d'Aide - ${client.user.username}`)
                .setDescription(
                    `Bienvenue sur le panneau d'aide de **${client.user.username}**.\n` +
                    `Utilisez le menu déroulant ci-dessous pour explorer les commandes par catégorie.\n\n` +
                    `**Commandes Totales:** ${client.commands.size}\n` +
                    `**Préfixe:** \`${prefix}\`\n\n` +
                    `> *Tout ce dont vous avez besoin pour protéger et gérer votre serveur.*`
                )
                .addFields(
                    { name: '❓ Besoin d\'aide sur une commande ?', value: `Faites \`${prefix}help <commande>\` pour voir les détails.` }
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Nami Protect ⚡ - Système de Sécurité Avancé', iconURL: message.guild.iconURL() })
                .setTimestamp();

            // 4. Envoyer le message
            const response = await message.reply({
                embeds: [homeEmbed],
                components: [row]
            });

            // 5. Créer le Collector
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 300000 // 5 minutes
            });

            collector.on('collect', async interaction => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: 'Ce menu est contrôlé par ' + message.author.tag, ephemeral: true });
                }

                const selected = interaction.values[0];

                if (selected === 'home') {
                    await interaction.update({ embeds: [homeEmbed] });
                } else {
                    // Afficher la catégorie
                    const categoryEmbed = this.getCategoryEmbed(selected, client, prefix, color);
                    await interaction.update({ embeds: [categoryEmbed] });
                }
            });

            collector.on('end', () => {
                // Désactiver le menu après expiration
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
                response.edit({ components: [disabledRow] }).catch(() => { });
            });

        } catch (err) {
            client.logger.error('Help command error: ' + err.stack);
            return message.reply('Une erreur est survenue lors de l\'affichage de l\'aide.');
        }
    },

    getCategoryEmbed(category, client, prefix, color) {
        const config = CATEGORY_CONFIG[category] || { emoji: '📁', label: category, description: '' };

        const commands = client.commands
            .filter(cmd => cmd.category === category)
            .map(cmd => {
                return `**${prefix}${cmd.name}**\n╰ ${cmd.description || 'Pas de description'}`;
            })
            .join('\n\n');

        return new EmbedBuilder()
            .setColor(color)
            .setTitle(`${config.emoji} ${config.label}`)
            .setDescription(`*${config.description}*\n\n${commands || 'Aucune commande trouvée.'}`)
            .setFooter({ text: `Utilisez ${prefix}help <commande> pour plus de détails` });
    },

    async showCommandHelp(message, commandName, client, prefix, color) {
        const cmd = client.commands.get(commandName.toLowerCase()) ||
            client.commands.get(client.aliases.get(commandName.toLowerCase()));

        if (!cmd) {
            return message.reply(`❌ Commande \`${commandName}\` introuvable.`);
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`📖 Aide : ${cmd.name}`)
            .setDescription(cmd.description || 'Pas de description.')
            .addFields(
                { name: 'Utilisation', value: `\`${prefix}${cmd.name} ${cmd.usage || ''}\``, inline: true },
                { name: 'Catégorie', value: cmd.category || 'Autre', inline: true },
                { name: 'Cooldown', value: `${cmd.cooldown || 3}s`, inline: true },
                { name: 'Aliases', value: cmd.aliases ? cmd.aliases.join(', ') : 'Aucun', inline: true }
            )
            .setFooter({ text: 'Nami Protect ⚡' });

        if (cmd.permissions) {
            embed.addFields({ name: 'Permissions', value: `\`${cmd.permissions.join(', ')}\``, inline: false });
        }

        return message.reply({ embeds: [embed] });
    }
};

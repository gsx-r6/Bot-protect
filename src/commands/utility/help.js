const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');
const ConfigService = require('../../services/ConfigService');

// Mapper pour afficher les permissions de manière lisible
const permissionLabels = {
    'BanMembers': '🔨 Bannir des Membres',
    'KickMembers': '👢 Expulser des Membres',
    'ModerateMembers': '🔇 Modérer les Membres',
    'ManageMessages': '🗑️ Gérer les Messages',
    'ManageGuild': '⚙️ Gérer le Serveur',
    'ManageChannels': '📁 Gérer les Salons',
    'ManageRoles': '🎭 Gérer les Rôles',
    'Administrator': '👑 Administrateur'
};

const CATEGORY_CONFIG = {
    'owner': { emoji: '👑', label: 'Propriétaire', description: 'Commandes réservées au propriétaire du bot' },
    'security': { emoji: '🛡️', label: 'Sécurité', description: 'Anti-raid, Quarantine, Lockdown, Whitelist' },
    'moderation': { emoji: '🔨', label: 'Modération', description: 'Ban, Kick, Mute, Warn, Mass Actions' },
    'administration': { emoji: '⚙️', label: 'Administration', description: 'Setup, Config, Backup, Restore' },
    'logging': { emoji: '📝', label: 'Logs & Audit', description: 'Journalisation des actions et événements' },
    'utility': { emoji: '🔧', label: 'Utilitaires', description: 'Giveaway, Poll, Outils divers' },
    'information': { emoji: 'ℹ️', label: 'Information', description: 'Infos serveur, utilisateur et bot' },
    'staff': { emoji: '👮', label: 'Staff', description: 'Outils réservés aux modérateurs' },
    'system': { emoji: '💻', label: 'Système', description: 'Métriques et débogage' }
};

module.exports = {
    name: 'help',
    description: 'Affiche le panneau d\'aide interactif',
    category: 'utility',
    aliases: ['aide', 'commands', 'menu'],
    cooldown: 5,
    usage: '[commande]',

    async execute(message, args, client) {
        try {
            const prefix = ConfigService.getPrefix(message.guild.id);
            const color = ConfigService.getEmbedColor(message.guild.id);
            const isOwner = message.author.id === (process.env.OWNER_ID || client.config.OWNER_ID);

            // 1. AIDE SPÉCIFIQUE (si argument fourni)
            if (args[0]) {
                const cmdName = args[0].toLowerCase();
                const cmd = client.commands.get(cmdName) || client.commands.get(client.aliases.get(cmdName));

                if (!cmd || (cmd.category === 'owner' && !isOwner)) {
                    return message.reply({
                        embeds: [new EmbedBuilder().setColor('Red').setDescription(`❌ Commande \`${cmdName}\` introuvable.`)]
                    });
                }

                return this.showCommandHelp(message, cmd, prefix, color);
            }

            // 2. MENU PRINCIPAL (Interactif)

            // Filtrer les catégories
            const categories = new Set();
            client.commands.forEach(cmd => {
                if (cmd.category === 'owner' && !isOwner) return; // Cacher owner si pas owner
                if (cmd.category && CATEGORY_CONFIG[cmd.category]) {
                    categories.add(cmd.category);
                }
            });

            // Trier les catégories (Sécurité en premier)
            const sortedCategories = Array.from(categories).sort((a, b) => {
                const priority = ['security', 'moderation', 'administration', 'utility', 'logging', 'information', 'staff', 'system'];
                return priority.indexOf(a) - priority.indexOf(b);
            });

            // Créer le Select Menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('📂 Sélectionnez une catégorie...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Accueil')
                        .setDescription('Retour au menu principal')
                        .setValue('home')
                        .setEmoji('🏠')
                );

            sortedCategories.forEach(cat => {
                const conf = CATEGORY_CONFIG[cat];
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(conf.label)
                        .setDescription(conf.description)
                        .setValue(cat)
                        .setEmoji(conf.emoji)
                );
            });

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Stats pour l'accueil
            const uptime = this.formatUptime(client.uptime);
            const ping = client.ws.ping;
            const commandCount = client.commands.size;

            // Embed Accueil
            const homeEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`🛡️ Panneau d'Aide - ${client.user.username}`)
                .setDescription(`Bonjour **${message.author.username}** ! 👋\n\nJe suis **${client.user.username}**, un bot de protection avancé et de modération.\nUtilisez le menu ci-dessous pour explorer mes fonctionnalités.`)
                .addFields(
                    { name: '📊 Statistiques', value: `> 🤖 **Commandes:** ${commandCount}\n> 📶 **Ping:** ${ping}ms\n> ⏱️ **Uptime:** ${uptime}`, inline: false },
                    { name: '💡 Astuce', value: `Utilisez \`${prefix}help <commande>\` pour avoir plus d'infos sur une commande spécifique.`, inline: false }
                )
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: 'Nami Protect ⚡ • v3.0.0', iconURL: message.guild.iconURL() })
                .setTimestamp();

            const response = await message.reply({ embeds: [homeEmbed], components: [row] });

            // Collecteur
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 600000 // 10 minutes
            });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '🚫 Ce menu vous n\'appartient pas.', ephemeral: true });
                }

                const value = i.values[0];

                if (value === 'home') {
                    await i.update({ embeds: [homeEmbed] });
                } else {
                    const catEmbed = this.getCategoryEmbed(value, client, prefix, color);
                    await i.update({ embeds: [catEmbed] });
                }
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
                response.edit({ components: [disabledRow] }).catch(() => { });
            });

        } catch (err) {
            client.logger.error('Help Error:', err);
            message.reply('Une erreur est survenue lors de l\'affichage de l\'aide.');
        }
    },

    getCategoryEmbed(category, client, prefix, color) {
        const conf = CATEGORY_CONFIG[category];
        const commands = client.commands.filter(c => c.category === category);

        const cmdList = commands.map(cmd => {
            return `**\`${prefix}${cmd.name}\`**\n╰ ${cmd.description}`;
        }).join('\n\n');

        return new EmbedBuilder()
            .setColor(color)
            .setTitle(`${conf.emoji} Catégorie : ${conf.label}`)
            .setDescription(`*${conf.description}*\n\n${cmdList}`)
            .setFooter({ text: `Total : ${commands.size} commandes` });
    },

    showCommandHelp(message, cmd, prefix, color) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`📖 ${prefix}${cmd.name}`)
            .setDescription(cmd.description || 'Aucune description.')
            .addFields(
                { name: '📂 Catégorie', value: cmd.category || 'Aucune', inline: true },
                { name: '⌨️ Utilisation', value: `\`${prefix}${cmd.name} ${cmd.usage || ''}\``, inline: true },
                { name: '⏱️ Cooldown', value: `${cmd.cooldown || 0}s`, inline: true },
                { name: '🔗 Aliases', value: cmd.aliases ? cmd.aliases.map(a => `\`${a}\``).join(', ') : 'Aucun', inline: false }
            )
            .setFooter({ text: 'Syntaxe: <requis> [optionnel]' });

        if (cmd.permissions) {
            const humanPerms = cmd.permissions.map(p => {
                const key = typeof p === 'string' ? p : p.toString().replace(/n$/, '');
                return permissionLabels[key] || key;
            }).join(', ');
            embed.addFields({ name: '🔒 Permissions', value: humanPerms, inline: false });
        }

        return message.reply({ embeds: [embed] });
    },

    formatUptime(ms) {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        const parts = [];
        if (d > 0) parts.push(`${d}j`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (parts.length === 0) return 'À l\'instant';

        return parts.join(' ');
    }
};

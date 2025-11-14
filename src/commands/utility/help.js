const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');

const CATEGORY_EMOJIS = {
    'utility': '🔧',
    'moderation': '🛡️',
    'information': 'ℹ️',
    'administration': '⚙️',
    'system': '🔐',
    'security': '🔒',
    'logging': '📝',
    'staff': '👥'
};

const CATEGORY_DESCRIPTIONS = {
    'administration': 'Configuration et gestion complète du serveur',
    'moderation': 'Sanctions, avertissements et contrôle des membres',
    'security': 'Protection anti-raid, anti-spam et sécurité avancée',
    'logging': 'Surveillance et journaux d\'activité du serveur',
    'staff': 'Outils dédiés à l\'équipe de modération',
    'utility': 'Commandes utilitaires et informations générales',
    'information': 'Statistiques et informations détaillées',
    'system': 'Gestion et contrôle du bot'
};

const FEATURED_COMMANDS = {
    'administration': ['setup', 'dashboard', 'config', 'rankpanel', 'setcolor'],
    'moderation': ['ban', 'warn', 'timeout', 'nuke', 'purge'],
    'security': ['antispam', 'antiraid', 'antinuke', 'security-check']
};

module.exports = {
    name: 'help',
    description: 'Menu d\'aide complet avec toutes les commandes disponibles',
    category: 'utility',
    aliases: ['h', 'commands', 'aide', 'commandes'],
    cooldown: 5,
    usage: '[commande]',
    
    async execute(message, args, client) {
        try {
            const prefix = ConfigService.getPrefix(message.guild.id);
            const color = ConfigService.getEmbedColor(message.guild.id);
            
            // Aide détaillée pour une commande spécifique
            if (args[0]) {
                return this.showCommandHelp(message, args[0], client, prefix, color);
            }

            // Menu principal d'aide
            const categories = {};
            let totalCommands = 0;
            
            client.commands.forEach(cmd => {
                const cat = cmd.category || 'Autre';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd);
                totalCommands++;
            });

            const sortedCategories = Object.entries(categories).sort((a, b) => {
                const order = ['administration', 'moderation', 'security', 'logging', 'staff', 'utility', 'information', 'system'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
            });

            // Embed principal
            const mainEmbed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({ 
                    name: `📚 Centre d'Aide - ${client.user.username}`, 
                    iconURL: client.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(
                    `> **${totalCommands} commandes** disponibles pour une protection optimale\n\n` +
                    `**🚀 Démarrage rapide**\n` +
                    `╰ \`${prefix}setup\` - Assistant de configuration interactif\n` +
                    `╰ \`${prefix}dashboard\` - Panel de contrôle complet\n` +
                    `╰ \`${prefix}rankpanel\` - Gestion interactive des rôles\n\n` +
                    `**📖 Navigation**\n` +
                    `╰ \`${prefix}help <commande>\` - Détails d'une commande\n` +
                    `╰ \`${prefix}help <catégorie>\` - Commandes d'une catégorie\n`
                )
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: `${message.guild.name} • Préfixe: ${prefix}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Ajouter les catégories
            sortedCategories.forEach(([cat, cmds]) => {
                const emoji = CATEGORY_EMOJIS[cat] || '📁';
                const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                const desc = CATEGORY_DESCRIPTIONS[cat] || '';
                
                // Commandes en vedette pour cette catégorie
                const featured = FEATURED_COMMANDS[cat] || [];
                const featuredCmds = cmds.filter(c => featured.includes(c.name));
                const otherCmds = cmds.filter(c => !featured.includes(c.name));
                
                let value = `${desc}\n`;
                
                if (featuredCmds.length > 0) {
                    value += `**⭐ Principales:** ${featuredCmds.map(c => `\`${c.name}\``).join(', ')}\n`;
                }
                
                const cmdList = otherCmds.map(c => c.name).join('`, `');
                if (cmdList) {
                    value += `**Autres:** \`${cmdList}\``;
                }

                mainEmbed.addFields({
                    name: `${emoji} ${catName} (${cmds.length} commandes)`,
                    value: value,
                    inline: false
                });
            });

            // Ajouter des infos utiles
            mainEmbed.addFields({
                name: '💡 Astuce',
                value: `Tapez \`${prefix}help administration\` pour voir uniquement les commandes d'administration`,
                inline: false
            });

            await message.reply({ embeds: [mainEmbed] });

        } catch (err) {
            client.logger.error('Help command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage de l\'aide.')] });
        }
    },

    async showCommandHelp(message, query, client, prefix, color) {
        // Vérifier si c'est une catégorie
        const categoryName = query.toLowerCase();
        const categories = {
            'administration': '⚙️',
            'moderation': '🛡️',
            'security': '🔒',
            'logging': '📝',
            'staff': '👥',
            'utility': '🔧',
            'information': 'ℹ️',
            'system': '🔐'
        };

        if (categories[categoryName]) {
            const categoryCmds = Array.from(client.commands.values())
                .filter(cmd => cmd.category === categoryName)
                .sort((a, b) => a.name.localeCompare(b.name));

            if (categoryCmds.length === 0) {
                return message.reply({ embeds: [embeds.error('Aucune commande dans cette catégorie.')] });
            }

            const emoji = categories[categoryName];
            const catTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            const desc = CATEGORY_DESCRIPTIONS[categoryName] || '';

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} Catégorie: ${catTitle}`)
                .setDescription(`${desc}\n\n**${categoryCmds.length} commandes disponibles**`)
                .setFooter({ text: `Utilisez ${prefix}help <commande> pour plus de détails` })
                .setTimestamp();

            // Grouper les commandes par 10
            const chunks = [];
            for (let i = 0; i < categoryCmds.length; i += 10) {
                chunks.push(categoryCmds.slice(i, i + 10));
            }

            chunks.forEach((chunk, index) => {
                const cmdList = chunk.map(cmd => {
                    const aliases = cmd.aliases && cmd.aliases.length > 0 ? 
                        ` (${cmd.aliases.join(', ')})` : '';
                    return `**${prefix}${cmd.name}**${aliases}\n╰ ${cmd.description || 'Pas de description'}`;
                }).join('\n\n');

                embed.addFields({
                    name: index === 0 ? '📋 Commandes' : `📋 Commandes (suite ${index + 1})`,
                    value: cmdList,
                    inline: false
                });
            });

            return message.reply({ embeds: [embed] });
        }

        // Sinon, chercher la commande
        const cmd = client.commands.get(query.toLowerCase()) || 
                    client.commands.get(client.aliases.get(query.toLowerCase()));
        
        if (!cmd) {
            return message.reply({ 
                embeds: [embeds.error(
                    `Commande ou catégorie \`${query}\` introuvable.\n\n` +
                    `**Catégories disponibles:**\n${Object.keys(categories).map(c => `• ${c}`).join('\n')}\n\n` +
                    `Utilisez \`${prefix}help\` pour voir toutes les commandes.`
                )] 
            });
        }
        
        const permText = cmd.permissions ? 
            cmd.permissions.map(p => {
                const perm = p.toString();
                return `\`${perm.replace(/([A-Z])/g, ' $1').trim()}\``;
            }).join(', ') :
            '`Aucune permission requise`';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ 
                name: `Aide: ${cmd.name}`,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`> ${cmd.description || 'Aucune description disponible'}`)
            .addFields(
                { 
                    name: '💡 Utilisation', 
                    value: `\`\`\`${prefix}${cmd.name} ${cmd.usage || ''}\`\`\``, 
                    inline: false 
                },
                { 
                    name: '🔖 Aliases', 
                    value: cmd.aliases && cmd.aliases.length > 0 ? 
                        cmd.aliases.map(a => `\`${a}\``).join(', ') : 
                        '`Aucun`', 
                    inline: true 
                },
                { 
                    name: '⏱️ Cooldown', 
                    value: `\`${cmd.cooldown || 3}s\``, 
                    inline: true 
                },
                { 
                    name: '📂 Catégorie', 
                    value: `${CATEGORY_EMOJIS[cmd.category] || '📁'} \`${cmd.category || 'Autre'}\``, 
                    inline: true 
                },
                { 
                    name: '🔐 Permissions requises', 
                    value: permText, 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Demandé par ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Ajouter des exemples pour certaines commandes
        const examples = this.getCommandExamples(cmd.name, prefix);
        if (examples) {
            embed.addFields({
                name: '📝 Exemples',
                value: examples,
                inline: false
            });
        }
        
        return message.reply({ embeds: [embed] });
    },

    getCommandExamples(cmdName, prefix) {
        const examples = {
            'rank': `\`${prefix}rank @membre @rôle add\` - Ajouter un rôle\n\`${prefix}rank @membre @rôle remove\` - Retirer un rôle`,
            'rankpanel': `\`${prefix}rankpanel\` - Ouvrir le panel interactif`,
            'rankconfig': `\`${prefix}rankconfig list\` - Voir vos permissions\n\`${prefix}rankconfig set @rôle @rôle1 @rôle2\` - Configurer`,
            'ban': `\`${prefix}ban @membre Spam\` - Bannir un membre\n\`${prefix}ban @membre Comportement toxique\` - Avec raison`,
            'warn': `\`${prefix}warn @membre Langage inapproprié\` - Avertir\n\`${prefix}warnings @membre\` - Voir les avertissements`,
            'setup': `\`${prefix}setup\` - Lancer l'assistant de configuration`,
            'dashboard': `\`${prefix}dashboard\` - Voir le panel de contrôle`,
            'config': `\`${prefix}config\` - Voir la configuration complète`,
            'setcolor': `\`${prefix}setcolor pink\` - Couleur rose\n\`${prefix}setcolor #FF5733\` - Couleur personnalisée`,
            'purge': `\`${prefix}purge 50\` - Supprimer 50 messages\n\`${prefix}purge 100 @membre\` - Messages d'un membre`,
            'tempban': `\`${prefix}tempban @membre 7d Spam\` - Ban temporaire de 7 jours`,
            'timeout': `\`${prefix}timeout @membre 1h Flood\` - Timeout d'1 heure`,
            'nuke': `\`${prefix}nuke\` - Recréer le salon actuel`,
            'autorole': `\`${prefix}autorole @Membre\` - Rôle automatique pour nouveaux`,
            'antispam': `\`${prefix}antispam on\` - Activer l'anti-spam`,
            'security-check': `\`${prefix}security-check\` - Audit de sécurité complet`
        };

        return examples[cmdName] || null;
    }
};

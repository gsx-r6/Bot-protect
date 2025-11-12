const { EmbedBuilder } = require('discord.js');
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
    'administration': 'Configuration et gestion du serveur',
    'moderation': 'Commandes de modération et sanctions',
    'security': 'Protection et systèmes anti-raid',
    'logging': 'Configuration des logs et journaux',
    'staff': 'Outils pour l\'équipe de modération',
    'utility': 'Commandes utilitaires générales',
    'information': 'Informations sur le serveur et les membres',
    'system': 'Commandes système du bot'
};

module.exports = {
    name: 'help',
    description: 'Affiche toutes les commandes disponibles',
    category: 'utility',
    aliases: ['h', 'commands', 'aide'],
    cooldown: 5,
    usage: '[commande]',
    
    async execute(message, args, client) {
        try {
            const prefix = ConfigService.getPrefix(message.guild.id);
            const color = ConfigService.getEmbedColor(message.guild.id);
            
            if (!args[0]) {
                const categories = {};
                let totalCommands = 0;
                
                client.commands.forEach(cmd => {
                    const cat = cmd.category || 'Autre';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(cmd.name);
                    totalCommands++;
                });

                const sortedCategories = Object.entries(categories).sort((a, b) => {
                    const order = ['administration', 'moderation', 'security', 'logging', 'staff', 'utility', 'information', 'system'];
                    return order.indexOf(a[0]) - order.indexOf(b[0]);
                });

                const fields = sortedCategories.map(([cat, cmds]) => {
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                    const desc = CATEGORY_DESCRIPTIONS[cat] || '';
                    
                    return {
                        name: `${emoji} ${catName} (${cmds.length})`,
                        value: `${desc}\n\`${cmds.join('`, `')}\``,
                        inline: false
                    };
                });

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({ 
                        name: `Menu d'Aide - ${client.user.username}`, 
                        iconURL: client.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(
                        `**${totalCommands} commandes disponibles**\n\n` +
                        `📖 Utilisez \`${prefix}help <commande>\` pour plus de détails\n` +
                        `⚙️ Utilisez \`${prefix}setup\` pour configurer le bot\n` +
                        `📊 Utilisez \`${prefix}dashboard\` pour le panel de contrôle\n`
                    )
                    .addFields(fields)
                    .setFooter({ 
                        text: `${message.guild.name} • Préfixe: ${prefix}`,
                        iconURL: message.guild.iconURL({ dynamic: true })
                    })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const cmd = client.commands.get(args[0].toLowerCase()) || 
                        client.commands.get(client.aliases.get(args[0].toLowerCase()));
            
            if (!cmd) {
                return message.reply({ embeds: [embeds.error(`Commande \`${args[0]}\` introuvable.\nUtilisez \`${prefix}help\` pour voir toutes les commandes.`)] });
            }
            
            const permText = cmd.permissions ? 
                cmd.permissions.map(p => `\`${p.toString().replace(/([A-Z])/g, ' $1').trim()}\``).join(', ') :
                'Aucune';

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${CATEGORY_EMOJIS[cmd.category] || '📌'} Commande: ${cmd.name}`)
                .setDescription(cmd.description || 'Aucune description disponible')
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
                            'Aucun', 
                        inline: true 
                    },
                    { 
                        name: '⏱️ Cooldown', 
                        value: `${cmd.cooldown || 3} secondes`, 
                        inline: true 
                    },
                    { 
                        name: '📂 Catégorie', 
                        value: `${CATEGORY_EMOJIS[cmd.category] || '📁'} ${cmd.category || 'Autre'}`, 
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
            
            return message.reply({ embeds: [embed] });
            
        } catch (err) {
            client.logger.error('Help command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'affichage de l\'aide.')] });
        }
    }
};

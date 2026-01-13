const { PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'ticketconfig',
    description: 'Configurer le système de tickets du serveur',
    category: 'tickets',
    aliases: ['tconfig', 'ticketsetup', 'setupticket'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    usage: '<sous-commande> [valeur]',

    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const guildId = message.guild.id;
            const color = ConfigService.getEmbedColor(guildId);
            const prefix = ConfigService.getPrefix(guildId);
            const subCommand = args[0]?.toLowerCase();

            if (!subCommand) {
                return this.showStatus(message, client, color, prefix);
            }

            switch (subCommand) {
                case 'staff':
                case 'role':
                    return this.setStaffRole(message, args, client, color);

                case 'category':
                case 'categorie':
                    return this.setCategory(message, args, client, color);

                case 'logs':
                case 'log':
                    return this.setLogChannel(message, args, client, color);

                case 'limit':
                case 'limite':
                case 'max':
                    return this.setMaxTickets(message, args, client, color);

                case 'title':
                case 'titre':
                    return this.setPanelTitle(message, args, client, color);

                case 'description':
                case 'desc':
                    return this.setPanelDescription(message, args, client, color);

                case 'color':
                case 'couleur':
                    return this.setPanelColor(message, args, client, color);

                case 'welcome':
                case 'message':
                    return this.setWelcomeMessage(message, args, client, color);

                case 'transcript':
                    return this.toggleTranscript(message, args, client, color);

                case 'reset':
                    return this.resetConfig(message, client, color);

                case 'addcategory':
                case 'addcat':
                    return this.addCategory(message, args, client, color);

                case 'delcategory':
                case 'delcat':
                    return this.deleteCategory(message, args, client, color);

                case 'status':
                case 'info':
                    return this.showStatus(message, client, color, prefix);

                case 'help':
                default:
                    return this.showHelp(message, client, color, prefix);
            }
        } catch (err) {
            client.logger.error('Ticketconfig command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la configuration des tickets.')] });
        }
    },

    async setStaffRole(message, args, client, color) {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

        if (!role) {
            return message.reply({ embeds: [embeds.error('Veuillez mentionner un rôle ou fournir son ID.\nExemple: `ticketconfig staff @Staff`')] });
        }

        db.setTicketConfig(message.guild.id, 'staff_role', role.id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Rôle Staff configuré')
            .setDescription(`Le rôle ${role} sera automatiquement ajouté aux tickets et pourra les gérer.`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG staff set to ${role.name} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setCategory(message, args, client, color) {
        const categoryId = args[1];

        if (!categoryId) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID de la catégorie.\nExemple: `ticketconfig category 123456789`')] });
        }

        const category = message.guild.channels.cache.get(categoryId);

        if (!category || category.type !== ChannelType.GuildCategory) {
            return message.reply({ embeds: [embeds.error('Catégorie introuvable ou invalide. Assurez-vous de fournir l\'ID d\'une catégorie.')] });
        }

        db.setTicketConfig(message.guild.id, 'category_id', category.id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Catégorie configurée')
            .setDescription(`Les tickets seront créés dans la catégorie **${category.name}**.`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG category set to ${category.name} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setLogChannel(message, args, client, color) {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

        if (!channel) {
            return message.reply({ embeds: [embeds.error('Veuillez mentionner un salon ou fournir son ID.\nExemple: `ticketconfig logs #ticket-logs`')] });
        }

        if (channel.type !== ChannelType.GuildText) {
            return message.reply({ embeds: [embeds.error('Veuillez sélectionner un salon textuel.')] });
        }

        db.setTicketConfig(message.guild.id, 'log_channel', channel.id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Salon de logs configuré')
            .setDescription(`Les logs des tickets seront envoyés dans ${channel}.`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG logs set to ${channel.name} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setMaxTickets(message, args, client, color) {
        const limit = parseInt(args[1]);

        if (isNaN(limit) || limit < 1 || limit > 10) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir un nombre entre 1 et 10.\nExemple: `ticketconfig limit 2`')] });
        }

        db.setTicketConfig(message.guild.id, 'max_tickets', limit);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Limite de tickets configurée')
            .setDescription(`Chaque utilisateur peut désormais avoir **${limit}** ticket(s) ouvert(s) maximum.`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG max_tickets set to ${limit} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setPanelTitle(message, args, client, color) {
        const title = args.slice(1).join(' ');

        if (!title || title.length > 100) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir un titre (max 100 caractères).\nExemple: `ticketconfig title Support Technique`')] });
        }

        db.setTicketConfig(message.guild.id, 'panel_title', title);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Titre du panel configuré')
            .setDescription(`Le titre du panel sera: **${title}**`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG panel_title set by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setPanelDescription(message, args, client, color) {
        const description = args.slice(1).join(' ');

        if (!description || description.length > 500) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir une description (max 500 caractères).\nExemple: `ticketconfig description Cliquez pour contacter le support`')] });
        }

        db.setTicketConfig(message.guild.id, 'panel_description', description);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Description du panel configurée')
            .setDescription(`La description sera:\n\n*${description}*`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG panel_description set by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setPanelColor(message, args, client, color) {
        const newColor = args[1];

        if (!newColor || !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir une couleur HEX valide.\nExemple: `ticketconfig color #5865F2`')] });
        }

        db.setTicketConfig(message.guild.id, 'panel_color', newColor);

        const embed = new EmbedBuilder()
            .setColor(newColor)
            .setTitle('✅ Couleur du panel configurée')
            .setDescription(`La couleur du panel sera: **${newColor}**`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG panel_color set to ${newColor} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async setWelcomeMessage(message, args, client, color) {
        const welcomeMsg = args.slice(1).join(' ');

        if (!welcomeMsg || welcomeMsg.length > 1000) {
            return message.reply({ embeds: [embeds.error('Veuillez fournir un message de bienvenue (max 1000 caractères).\nVariables: `{user}` (mention), `{username}` (nom), `{server}` (serveur)\nExemple: `ticketconfig message Bienvenue {user} ! Comment pouvons-nous vous aider ?`')] });
        }

        db.setTicketConfig(message.guild.id, 'welcome_message', welcomeMsg);

        const preview = welcomeMsg
            .replace(/{user}/g, message.author.toString())
            .replace(/{username}/g, message.author.username)
            .replace(/{server}/g, message.guild.name);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Message de bienvenue configuré')
            .setDescription(`**Aperçu:**\n${preview}`)
            .setTimestamp();

        client.logger.command(`TICKETCONFIG welcome_message set by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async toggleTranscript(message, args, client, color) {
        const config = db.getTicketConfig(message.guild.id);
        const currentState = config?.transcript_enabled ?? 1;
        const newState = currentState ? 0 : 1;

        db.setTicketConfig(message.guild.id, 'transcript_enabled', newState);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Transcripts configurés')
            .setDescription(newState ? '📝 Les transcripts seront générés lors de la fermeture des tickets.' : '❌ Les transcripts sont désactivés.')
            .setTimestamp();

        client.logger.command(`TICKETCONFIG transcript_enabled set to ${newState} by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async resetConfig(message, client, color) {
        db.resetTicketConfig(message.guild.id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🔄 Configuration réinitialisée')
            .setDescription('La configuration des tickets a été réinitialisée aux valeurs par défaut.')
            .setTimestamp();

        client.logger.command(`TICKETCONFIG reset by ${message.author.tag}`);
        return message.reply({ embeds: [embed] });
    },

    async addCategory(message, args, client, color) {
        const name = args[1];
        const roleId = args[2];
        const dispCategoryId = args[3];
        const emoji = args[4] || '🎫';
        const description = args.slice(5).join(' ') || 'Ouvrir un ticket dans cette catégorie';

        if (!name || !roleId || !dispCategoryId) {
            return message.reply({
                embeds: [embeds.error('Utilisation incorrecte.\n`ticketconfig addcategory <nom> <ID_Role_Staff> <ID_Categorie_Discord> [emoji] [description]`')]
            });
        }

        const role = message.guild.roles.cache.get(roleId);
        const discordCategory = message.guild.channels.cache.get(dispCategoryId);

        if (!role) return message.reply({ embeds: [embeds.error('Rôle staff introuvable.')] });
        if (!discordCategory || discordCategory.type !== ChannelType.GuildCategory) {
            return message.reply({ embeds: [embeds.error('Catégorie Discord introuvable ou invalide.')] });
        }

        db.addTicketCategory(message.guild.id, {
            name: name,
            label: name,
            emoji: emoji,
            description: description,
            staff_role_id: roleId,
            category_id: dispCategoryId
        });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Catégorie Ajoutée')
            .setDescription(`La catégorie **${name}** a été ajoutée avec succès.`)
            .addFields(
                { name: '🛡️ Staff', value: `<@&${roleId}>`, inline: true },
                { name: '📁 Categorie', value: discordCategory.name, inline: true }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async deleteCategory(message, args, client, color) {
        const id = args[1];
        if (!id) return message.reply({ embeds: [embeds.error('Veuillez fournir l\'ID de la catégorie à supprimer. (Voir `ticketconfig status`)')] });

        db.deleteTicketCategory(message.guild.id, id);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🗑️ Catégorie Supprimée')
            .setDescription(`La catégorie avec l'ID **${id}** a été supprimée.`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async showStatus(message, client, color, prefix) {
        const config = db.getTicketConfig(message.guild.id) || {};
        const stats = db.getTicketStats(message.guild.id);
        const categories = db.getTicketCategories(message.guild.id);

        const staffRole = config.staff_role ? `<@&${config.staff_role}>` : '❌ Non configuré';
        const category = config.category_id ? message.guild.channels.cache.get(config.category_id)?.name || '❌ Catégorie supprimée' : '❌ Non configuré';
        const logChannel = config.log_channel ? `<#${config.log_channel}>` : '❌ Non configuré';
        const maxTickets = config.max_tickets ?? 1;
        const transcriptEnabled = config.transcript_enabled ?? 1;

        const categoriesList = categories.length > 0
            ? categories.map(c => `**ID: ${c.id}** | ${c.emoji} ${c.name} (Staff: <@&${c.staff_role_id}>)`).join('\n')
            : 'Aucune catégorie spécifique (Utilise la config globale)';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎫 Configuration des Tickets')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '⚙️ Configuration Globale',
                    value: [
                        `**Rôle Staff:** ${staffRole}`,
                        `**Catégorie:** ${category}`,
                        `**Logs:** ${logChannel}`,
                        `**Limite par user:** ${maxTickets}`,
                        `**Transcripts:** ${transcriptEnabled ? '✅ Activés' : '❌ Désactivés'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📂 Catégories Spécifiques',
                    value: categoriesList,
                    inline: false
                },
                {
                    name: '🎨 Panel',
                    value: [
                        `**Titre:** ${config.panel_title || 'Support Tickets'}`,
                        `**Couleur:** ${config.panel_color || '#5865F2'}`,
                        `**Description:** ${config.panel_description ? (config.panel_description.substring(0, 50) + (config.panel_description.length > 50 ? '...' : '')) : 'Par défaut'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Statistiques',
                    value: [
                        `**Total:** ${stats.total}`,
                        `**Ouverts:** ${stats.open}`,
                        `**Fermés:** ${stats.closed}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: `Utilisez ${prefix}ticketconfig help pour voir les commandes` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async showHelp(message, client, color, prefix) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎫 Aide - Configuration des Tickets')
            .setDescription('Configurez le système de tickets de votre serveur.')
            .addFields(
                {
                    name: '📋 Commandes disponibles',
                    value: [
                        `\`${prefix}ticketconfig\` - Afficher la configuration`,
                        `\`${prefix}ticketconfig staff @role\` - Définir le rôle staff`,
                        `\`${prefix}ticketconfig category <ID>\` - Définir la catégorie`,
                        `\`${prefix}ticketconfig logs #salon\` - Définir le salon de logs`,
                        `\`${prefix}ticketconfig limit <1-10>\` - Limite de tickets par user`,
                        `\`${prefix}ticketconfig title <titre>\` - Titre du panel`,
                        `\`${prefix}ticketconfig description <texte>\` - Description du panel`,
                        `\`${prefix}ticketconfig color #RRGGBB\` - Couleur du panel`,
                        `\`${prefix}ticketconfig message <texte>\` - Message d'accueil`,
                        `\`${prefix}ticketconfig transcript\` - Activer/désactiver transcripts`,
                        `\`${prefix}ticketconfig reset\` - Réinitialiser la config`,
                        `\`${prefix}ticketconfig addcategory <nom> <roleID> <catID> [emoji] [desc]\` - Ajouter une catégorie`,
                        `\`${prefix}ticketconfig delcategory <ID>\` - Supprimer une catégorie`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📝 Variables pour le message',
                    value: '`{user}` - Mention de l\'utilisateur\n`{username}` - Nom d\'utilisateur\n`{server}` - Nom du serveur',
                    inline: false
                },
                {
                    name: '💡 Conseil',
                    value: `Après configuration, utilisez \`${prefix}ticket\` pour publier le panel de tickets.`,
                    inline: false
                }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};

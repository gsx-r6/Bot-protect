const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

const COLORS = {
    success: '#00FF00',
    error: '#FF0000',
    warn: '#FFA500',
    info: '#0099FF',
    moderation: '#FF69B4',
    security: '#8B00FF',
    default: config.EMBED_COLOR || '#FF69B4'
};

const make = (type, title, description, options = {}) => {
    const color = COLORS[type] || COLORS.default;
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Haruka Protect ⚡' });
    
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (options.fields) options.fields.forEach(f => embed.addFields(f));
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    
    return embed;
};

module.exports = {
    success: (description, title, options) => make('success', title || '✅ Succès', description, options),
    
    error: (description, title, options) => make('error', title || '❌ Erreur', description, options),
    
    info: (description, title, options) => make('info', title || 'ℹ️ Information', description, options),
    
    warn: (description, title, options) => make('warn', title || '⚠️ Avertissement', description, options),
    
    moderation: (description, title, options) => make('moderation', title || '🛡️ Modération', description, options),
    
    security: (description, title, options) => make('security', title || '🔒 Sécurité', description, options),

    missingArgs: (usage, description = '') => {
        return make('error', '❌ Arguments manquants', 'Cette commande nécessite des arguments.', {
            fields: [
                { name: '📝 Utilisation', value: `\`${usage}\`` },
                { name: 'ℹ️ Description', value: description || 'Non disponible' }
            ],
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/3588/3588478.png'
        });
    },

    missingPermissions: (permissions = []) => {
        const permNames = {
            'Administrator': 'Administrateur',
            'ManageGuild': 'Gérer le serveur',
            'ManageRoles': 'Gérer les rôles',
            'ManageChannels': 'Gérer les canaux',
            'ManageMembers': 'Gérer les membres',
            'KickMembers': 'Expulser des membres',
            'BanMembers': 'Bannir des membres'
        };
        
        const permList = permissions.map(p => `• ${permNames[p] || p}`).join('\n');
        return make('error', '❌ Permissions manquantes', 'Vous n\'avez pas les permissions requises.', {
            fields: [
                { name: 'Permissions requises', value: permList || 'Non spécifiée' }
            ]
        });
    },

    botMissingPermissions: (permissions = []) => {
        const permNames = {
            'Administrator': 'Administrateur',
            'ManageGuild': 'Gérer le serveur',
            'ManageRoles': 'Gérer les rôles',
            'ManageChannels': 'Gérer les canaux',
            'ManageMembers': 'Gérer les membres',
            'KickMembers': 'Expulser des membres',
            'BanMembers': 'Bannir des membres'
        };
        
        const permList = permissions.map(p => `• ${permNames[p] || p}`).join('\n');
        return make('error', '❌ Permissions insuffisantes', 'Je n\'ai pas les permissions nécessaires pour exécuter cette commande.', {
            fields: [
                { name: 'Permissions requises', value: permList || 'Non spécifiée' }
            ]
        });
    },

    cooldown: (cooldownTime) => {
        return make('warn', '⏱️ Commande en cooldown', `Attendez ${cooldownTime}s avant de réutiliser cette commande.`, {
            fields: [
                { name: '⏳ Temps d\'attente', value: `${cooldownTime}s` }
            ]
        });
    },

    commandNotFound: (commandName) => {
        return make('error', '❌ Commande non trouvée', `La commande \`${commandName}\` n'existe pas.`, {
            fields: [
                { name: '💡 Conseil', value: 'Utilisez `+help` pour voir toutes les commandes disponibles.' }
            ]
        });
    },

    invalidUsage: (usage, description = '', examples = []) => {
        const exampleText = Array.isArray(examples) 
            ? examples.map((ex, i) => `${i + 1}. \`${ex}\``).join('\n')
            : examples;
            
        const fields = [
            { name: '📖 Utilisation correcte', value: `\`${usage}\`` },
            { name: 'ℹ️ Description', value: description || 'Non disponible' }
        ];
        
        if (exampleText) {
            fields.push({ name: '📚 Exemple(s)', value: exampleText });
        }
        
        return make('error', '❌ Utilisation incorrecte', 'La commande n\'a pas été utilisée correctement.', {
            fields,
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/3588/3588478.png'
        });
    },

    custom: (title, description, color, options) => {
        const embed = new EmbedBuilder()
            .setColor(color || COLORS.default)
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });
        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (options?.fields) options.fields.forEach(f => embed.addFields(f));
        if (options?.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options?.image) embed.setImage(options.image);
        if (options?.author) embed.setAuthor(options.author);
        return embed;
    }
};

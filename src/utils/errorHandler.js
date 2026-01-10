const { EmbedBuilder } = require('discord.js');
const Response = require('./Response');

const ERROR_TYPES = {
    MISSING_PERMISSIONS: 'MISSING_PERMISSIONS',
    BOT_MISSING_PERMISSIONS: 'BOT_MISSING_PERMISSIONS',
    MISSING_ARGUMENTS: 'MISSING_ARGUMENTS',
    INVALID_ARGUMENT: 'INVALID_ARGUMENT',
    COOLDOWN: 'COOLDOWN',
    COMMAND_ERROR: 'COMMAND_ERROR',
    INVALID_USAGE: 'INVALID_USAGE',
    USER_ERROR: 'USER_ERROR',
    NOT_FOUND: 'NOT_FOUND'
};

const PERMISSION_NAMES = {
    'Administrator': 'Administrateur',
    'ManageGuild': 'Gérer le serveur',
    'ManageRoles': 'Gérer les rôles',
    'ManageChannels': 'Gérer les canaux',
    'ManageMembers': 'Gérer les membres',
    'KickMembers': 'Expulser des membres',
    'BanMembers': 'Bannir des membres',
    'MuteMembers': 'Rendre muet les membres',
    'DeafenMembers': 'Assouvir les membres',
    'MoveMembers': 'Déplacer les membres',
    'CreateInstantInvite': 'Créer des invitations',
    'SendMessages': 'Envoyer des messages',
    'EmbedLinks': 'Insérer des liens',
    'AttachFiles': 'Attacher des fichiers',
    'ReadMessageHistory': 'Lire l\'historique',
    'MentionEveryone': 'Mentionner @everyone',
    'UseExternalEmojis': 'Utiliser des emojis externes',
    'ManageMessages': 'Gérer les messages',
    'ViewAuditLog': 'Afficher le journal d\'audit'
};

class ErrorHandler {
    static createErrorEmbed(type, options = {}) {
        let title = 'Erreur';
        let description = 'Une erreur inconnue est survenue.';
        let fields = [];

        switch (type) {
            case ERROR_TYPES.MISSING_PERMISSIONS:
                title = 'Permissions manquantes';
                description = `Vous n'avez pas les permissions requises pour utiliser cette commande.`;
                fields.push({ name: 'Permissions requises', value: options.permissions?.map(p => `• ${PERMISSION_NAMES[p] || p}`).join('\n') || 'Non spécifiée' });
                break;

            case ERROR_TYPES.BOT_MISSING_PERMISSIONS:
                title = 'Permissions du bot insuffisantes';
                description = `Je n'ai pas les permissions nécessaires pour exécuter cette commande.`;
                fields.push({ name: 'Permissions requises', value: options.permissions?.map(p => `• ${PERMISSION_NAMES[p] || p}`).join('\n') || 'Non spécifiée' });
                break;

            case ERROR_TYPES.MISSING_ARGUMENTS:
                title = 'Arguments manquants';
                description = `Cette commande nécessite des arguments.`;
                fields.push(
                    { name: '📖 Utilisation', value: `\`${options.usage}\`` },
                    { name: 'ℹ️ Description', value: options.description || 'Non disponible' }
                );
                break;

            case ERROR_TYPES.INVALID_ARGUMENT:
                title = 'Argument invalide';
                description = `L'argument fourni est invalide.`;
                fields.push(
                    { name: '📝 Détails', value: options.details || 'Vérifiez votre syntaxe' },
                    { name: '📖 Utilisation', value: `\`${options.usage}\`` }
                );
                break;

            case ERROR_TYPES.COOLDOWN:
                title = 'Commande en cooldown';
                description = `Attendez avant de réutiliser cette commande.`;
                fields.push({ name: '⏳ Temps d\'attente', value: `${options.cooldownTime}s` });
                break;

            case ERROR_TYPES.INVALID_USAGE:
                title = 'Utilisation incorrecte';
                description = `La commande n'a pas été utilisée correctement.`;
                fields.push(
                    { name: '📖 Utilisation correcte', value: `\`${options.usage}\`` },
                    { name: 'ℹ️ Description', value: options.description || 'Non disponible' }
                );
                if (options.examples) fields.push({ name: '📚 Exemple(s)', value: options.examples || 'Consultez l\'aide' });
                break;

            case ERROR_TYPES.COMMAND_ERROR:
                title = 'Erreur lors de l\'exécution';
                description = `Une erreur interne est survenue.`;
                fields.push({ name: '🔍 Détails', value: options.message || 'Erreur inconnue' });
                if (process.env.NODE_ENV === 'development') {
                    fields.push({ name: '🐛 Stack (Dev)', value: `\`\`\`${options.stack?.slice(0, 500) || 'N/A'}\`\`\`` });
                }
                break;

            case ERROR_TYPES.USER_ERROR:
                title = 'Action impossible';
                description = options.message || 'Une erreur est survenue.';
                break;

            case ERROR_TYPES.NOT_FOUND:
                title = 'Non trouvé';
                description = options.message || 'La ressource demandée n\'existe pas.';
                break;
        }

        // Use the new standard Response style mostly, but keep specific fields logic
        const embed = new EmbedBuilder()
            .setColor(Response.colors.ERROR) // Use global error color
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    static async handleCommandError(message, error, command = null) {
        let errorType = ERROR_TYPES.COMMAND_ERROR;
        let options = { message: error.message, stack: error.stack };

        try {
            await message.reply({
                embeds: [this.createErrorEmbed(errorType, options)],
                allowedMentions: { repliedUser: false }
            });
        } catch (e) {
            const logger = require('../utils/logger');
            logger.error('Erreur lors de l\'envoi de l\'embed d\'erreur:', e);
        }
    }

    static validateCommand(command, message) {
        const result = {
            valid: true,
            error: null,
            type: null
        };

        if (!command) {
            result.valid = false;
            result.type = ERROR_TYPES.NOT_FOUND;
            return result;
        }

        if (command.permissions && command.permissions.length > 0) {
            if (!message.member.permissions.has(command.permissions)) {
                result.valid = false;
                result.type = ERROR_TYPES.MISSING_PERMISSIONS;
                result.permissions = command.permissions;
                return result;
            }
        }

        if (command.botPermissions && command.botPermissions.length > 0) {
            if (!message.guild.members.me.permissions.has(command.botPermissions)) {
                result.valid = false;
                result.type = ERROR_TYPES.BOT_MISSING_PERMISSIONS;
                result.permissions = command.botPermissions;
                return result;
            }
        }

        return result;
    }

    static createHelpEmbed(command) {
        if (!command) return null;

        // Use standard Premium/Info color for help
        const embed = new EmbedBuilder()
            .setColor(Response.colors.INFO)
            .setTitle(`📖 Aide - ${command.name.toUpperCase()}`)
            .setDescription(command.description || 'Aucune description')
            .setFooter({ text: 'Nami Protect ⚡' })
            .setTimestamp();

        if (command.usage) {
            embed.addFields({ name: '📝 Utilisation', value: `\`${command.usage}\`` });
        }

        if (command.examples) {
            embed.addFields({
                name: '📚 Exemples',
                value: Array.isArray(command.examples)
                    ? command.examples.map((ex, i) => `${i + 1}. \`${ex}\``).join('\n')
                    : `\`${command.examples}\``
            });
        }

        if (command.permissions && command.permissions.length > 0) {
            embed.addFields({
                name: '🔐 Permissions requises',
                value: command.permissions.map(p => `• ${PERMISSION_NAMES[p] || p}`).join('\n')
            });
        }

        if (command.cooldown) {
            embed.addFields({ name: '⏱️ Cooldown', value: `${command.cooldown}s` });
        }

        return embed;
    }
}

module.exports = {
    ErrorHandler,
    ERROR_TYPES,
    PERMISSION_NAMES
};

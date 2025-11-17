const { EmbedBuilder } = require('discord.js');

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
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTimestamp()
            .setFooter({ text: 'Haruka Protect ⚡' });

        switch (type) {
            case ERROR_TYPES.MISSING_PERMISSIONS:
                embed.setTitle('❌ Permissions manquantes')
                    .setDescription(`Vous n'avez pas les permissions requises pour utiliser cette commande.`)
                    .addFields(
                        { name: 'Permissions requises', value: options.permissions?.map(p => `• ${PERMISSION_NAMES[p] || p}`).join('\n') || 'Non spécifiée' }
                    );
                break;

            case ERROR_TYPES.BOT_MISSING_PERMISSIONS:
                embed.setTitle('❌ Permissions du bot insuffisantes')
                    .setDescription(`Je n'ai pas les permissions nécessaires pour exécuter cette commande.`)
                    .addFields(
                        { name: 'Permissions requises', value: options.permissions?.map(p => `• ${PERMISSION_NAMES[p] || p}`).join('\n') || 'Non spécifiée' }
                    );
                break;

            case ERROR_TYPES.MISSING_ARGUMENTS:
                embed.setTitle('❌ Arguments manquants')
                    .setDescription(`Cette commande nécessite des arguments.`)
                    .addFields(
                        { name: '📖 Utilisation', value: `\`${options.usage}\`` },
                        { name: 'ℹ️ Description', value: options.description || 'Non disponible' }
                    )
                    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3588/3588478.png');
                break;

            case ERROR_TYPES.INVALID_ARGUMENT:
                embed.setTitle('❌ Argument invalide')
                    .setDescription(`L'argument fourni est invalide.`)
                    .addFields(
                        { name: '📝 Détails', value: options.details || 'Vérifiez votre syntaxe' },
                        { name: '📖 Utilisation', value: `\`${options.usage}\`` }
                    );
                break;

            case ERROR_TYPES.COOLDOWN:
                embed.setTitle('⏱️ Commande en cooldown')
                    .setDescription(`Attendez avant de réutiliser cette commande.`)
                    .addFields(
                        { name: '⏳ Temps d\'attente', value: `${options.cooldownTime}s` }
                    );
                break;

            case ERROR_TYPES.INVALID_USAGE:
                embed.setTitle('❌ Utilisation incorrecte')
                    .setDescription(`La commande n'a pas été utilisée correctement.`)
                    .addFields(
                        { name: '📖 Utilisation correcte', value: `\`${options.usage}\`` },
                        { name: 'ℹ️ Description', value: options.description || 'Non disponible' },
                        { name: '📚 Exemple(s)', value: options.examples || 'Consultez l\'aide' }
                    )
                    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3588/3588478.png');
                break;

            case ERROR_TYPES.COMMAND_ERROR:
                embed.setTitle('❌ Erreur lors de l\'exécution')
                    .setDescription(`Une erreur est survenue lors de l\'exécution de la commande.`)
                    .addFields(
                        { name: '🔍 Détails', value: options.message || 'Erreur inconnue' }
                    );
                if (process.env.NODE_ENV === 'development') {
                    embed.addFields({ name: '🐛 Stack (Dev)', value: `\`\`\`${options.stack?.slice(0, 500) || 'N/A'}\`\`\`` });
                }
                break;

            case ERROR_TYPES.USER_ERROR:
                embed.setTitle('❌ Erreur')
                    .setDescription(options.message || 'Une erreur est survenue.');
                break;

            case ERROR_TYPES.NOT_FOUND:
                embed.setTitle('❌ Non trouvé')
                    .setDescription(options.message || 'La ressource demandée n\'existe pas.');
                break;

            default:
                embed.setTitle('❌ Erreur')
                    .setDescription('Une erreur inconnue est survenue.');
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
            console.error('Erreur lors de l\'envoi de l\'embed d\'erreur:', e);
        }
    }

    static validateCommand(command, message) {
        const result = {
            valid: true,
            error: null,
            type: null
        };

        // Vérifier si la commande existe
        if (!command) {
            result.valid = false;
            result.type = ERROR_TYPES.NOT_FOUND;
            return result;
        }

        // Vérifier les permissions de l'utilisateur
        if (command.permissions && command.permissions.length > 0) {
            if (!message.member.permissions.has(command.permissions)) {
                result.valid = false;
                result.type = ERROR_TYPES.MISSING_PERMISSIONS;
                result.permissions = command.permissions;
                return result;
            }
        }

        // Vérifier les permissions du bot
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

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle(`📖 Aide - ${command.name.toUpperCase()}`)
            .setDescription(command.description || 'Aucune description')
            .setFooter({ text: 'Haruka Protect ⚡' })
            .setTimestamp();

        if (command.usage) {
            embed.addFields({
                name: '📝 Utilisation',
                value: `\`${command.usage}\``
            });
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
            embed.addFields({
                name: '⏱️ Cooldown',
                value: `${command.cooldown}s`
            });
        }

        return embed;
    }
}

module.exports = {
    ErrorHandler,
    ERROR_TYPES,
    PERMISSION_NAMES
};

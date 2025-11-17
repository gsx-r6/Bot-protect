const { Events } = require('discord.js');
const logger = require('../../utils/logger');
const cooldownHandler = require('../../handlers/cooldownHandler');
const { ErrorHandler, ERROR_TYPES } = require('../../utils/errorHandler');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    
    async execute(message, client) {
        try {
            if (message.author.bot) return;
            
            const prefix = client.config.PREFIX || '+';
            if (!message.content.startsWith(prefix)) return;
            
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            logger.debug(`📝 Commande reçue: ${commandName} par ${message.author.tag}`);
            
            const command = client.commands.get(commandName) 
                         || client.commands.get(client.aliases.get(commandName));
            
            // Si commande non trouvée, ne pas répondre (ignore silencieux)
            if (!command) {
                logger.debug(`❌ Commande non trouvée: ${commandName}`);
                return;
            }
            
            logger.debug(`✅ Commande trouvée: ${command.name}`);
            
            // Valider la commande (permissions, etc.)
            const validation = ErrorHandler.validateCommand(command, message);
            if (!validation.valid) {
                const errorEmbed = ErrorHandler.createErrorEmbed(validation.type, {
                    permissions: validation.permissions,
                    usage: command.usage || `+${command.name}`,
                    description: command.description
                });
                return message.reply({ embeds: [errorEmbed], allowedMentions: { repliedUser: false } });
            }
            
            // Vérifier le cooldown
            const cooldownTime = cooldownHandler.isOnCooldown(message.author.id, command.name);
            if (cooldownTime) {
                const errorEmbed = ErrorHandler.createErrorEmbed(ERROR_TYPES.COOLDOWN, {
                    cooldownTime
                });
                return message.reply({ embeds: [errorEmbed], allowedMentions: { repliedUser: false } });
            }
            
            const cooldown = command.cooldown || 3;
            cooldownHandler.setCooldown(message.author.id, command.name, cooldown);
            
            // Exécuter la commande
            await command.execute(message, args, client);
            
            logger.command(`${command.name} utilisée par ${message.author.tag} dans #${message.channel.name}`);
            
        } catch (error) {
            logger.error('[MessageCreate] Erreur:', error);
            try {
                const errorEmbed = ErrorHandler.createErrorEmbed(ERROR_TYPES.COMMAND_ERROR, {
                    message: error.message || 'Erreur inconnue',
                    stack: error.stack
                });
                await message.reply({ 
                    embeds: [errorEmbed],
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            } catch (e) {
                logger.error('Erreur lors de l\'envoi du message d\'erreur:', e);
            }
        }
    }
};

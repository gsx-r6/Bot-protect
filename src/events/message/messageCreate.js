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
            if (!message.inGuild()) return;
            
            const AUTOMOD_CHANNEL = '1440404482541355212';
            
            const insultePatterns = [
                /\b(pd|pute|salope|connard|batard|fdp|enculé|enculer|ntm|tg|ferme ta gueule|ta gueule)\b/i
            ];
            
            const argentPatterns = [
                /\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$|£|livre)?\s*(paypal|virement|venmo|cashapp|transfert)\b/i,
                /\b(paypal|virement|cb|carte bancaire|iban|venmo|cashapp)\s+.*\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\b/i,
                /\b(vendre?|vends|acheter?|achète)\s+.*\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\b/i,
                /\b(\d+(?:[.,]\d+)?)\s*([k€]|k\s*€|€|euro|euros|dollars?|\$)\s+(via|par|avec|sur|en)\s*(paypal|virement|venmo)\b/i
            ];

            let hasInsulte = false;
            let hasArgent = false;
            
            for (const pattern of insultePatterns) {
                if (pattern.test(message.content)) {
                    hasInsulte = true;
                    break;
                }
            }

            for (const pattern of argentPatterns) {
                if (pattern.test(message.content)) {
                    hasArgent = true;
                    break;
                }
            }

            if (hasInsulte || hasArgent) {
                const automodChannel = message.guild.channels.cache.get(AUTOMOD_CHANNEL);
                if (automodChannel) {
                    try {
                        const { EmbedBuilder } = require('discord.js');
                        const embed = new EmbedBuilder()
                            .setColor(hasInsulte ? '#FF0000' : '#FFA500')
                            .setTitle(`${hasInsulte ? '⚠️ INSULTE DÉTECTÉE' : '💰 MENTION D\'ARGENT DÉTECTÉE'}`)
                            .setDescription(`Message de ${message.author} dans ${message.channel}`)
                            .addFields(
                                { name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
                                { name: '#️⃣ Salon', value: `<#${message.channel.id}>`, inline: true },
                                { name: '📝 Contenu', value: message.content.substring(0, 1024) || 'Aucun contenu texte' },
                                { name: '🔗 Lien', value: `[Aller au message](${message.url})` }
                            )
                            .setTimestamp();
                        
                        await automodChannel.send({ embeds: [embed] });
                    } catch (err) {
                        logger.error('Error sending automod alert: ' + err.message);
                    }
                }
            }
            
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

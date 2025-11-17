/**
 * EXEMPLE: Commande avec le nouveau système d'erreurs
 * Ce fichier montre comment implémenter une commande avec une gestion d'erreurs professionnelle
 */

const embeds = require('../../utils/embeds');

module.exports = {
    name: 'setprefix',
    description: 'Changer le préfixe du bot pour votre serveur',
    usage: '+setprefix <nouveau_préfixe>',
    category: 'administration',
    examples: [
        '+setprefix !',
        '+setprefix >>',
        '+setprefix $'
    ],
    aliases: ['changeprefix', 'updateprefix'],
    permissions: ['Administrator'],
    cooldown: 5,
    
    async execute(message, args, client) {
        // ❌ VALIDATION 1: Arguments manquants
        if (args.length === 0) {
            return message.reply({
                embeds: [embeds.missingArgs('+setprefix <nouveau_préfixe>', 'Définir un nouveau préfixe pour le bot')],
                allowedMentions: { repliedUser: false }
            });
        }
        
        const newPrefix = args[0];
        
        // ❌ VALIDATION 2: Longueur du préfixe
        if (newPrefix.length > 5) {
            return message.reply({
                embeds: [embeds.invalidUsage(
                    '+setprefix <nouveau_préfixe>',
                    'Le préfixe doit faire 5 caractères maximum',
                    ['+setprefix !', '+setprefix >']
                )],
                allowedMentions: { repliedUser: false }
            });
        }
        
        try {
            // 🔧 Logique métier
            // Dans un vrai bot, cela mettrait en jour la base de données
            client.config[message.guild.id] = { prefix: newPrefix };
            
            // ✅ Succès
            return message.reply({
                embeds: [embeds.success(
                    `Le préfixe a été changé en: \`${newPrefix}\``,
                    '✅ Préfixe mis à jour',
                    {
                        fields: [
                            { name: 'Ancien préfixe', value: '+' },
                            { name: 'Nouveau préfixe', value: newPrefix },
                            { name: 'Changé par', value: message.author.tag }
                        ]
                    }
                )],
                allowedMentions: { repliedUser: false }
            });
            
        } catch (error) {
            // ❌ Erreur d'exécution
            client.logger.error('Erreur setprefix:', error);
            return message.reply({
                embeds: [embeds.error(
                    'Une erreur est survenue lors de la mise à jour du préfixe.',
                    '❌ Erreur du serveur'
                )],
                allowedMentions: { repliedUser: false }
            });
        }
    }
};

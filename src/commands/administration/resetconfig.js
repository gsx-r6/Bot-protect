const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const ConfigService = require('../../services/ConfigService');
const AutomodService = require('../../services/AutomodService');
const db = require('../../database/database');

module.exports = {
    name: 'resetconfig',
    description: 'Réinitialiser la configuration du serveur',
    category: 'administration',
    aliases: ['configreset', 'resetconf'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 60,
    usage: '[confirm]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante (Administrateur requis)')] });
            }

            if (!args[0] || args[0].toLowerCase() !== 'confirm') {
                const embed = embeds.warning(
                    '⚠️ **Attention!** Cette commande va réinitialiser **toute la configuration** de votre serveur:\n\n' +
                    '• Préfixe\n' +
                    '• Messages de bienvenue/au revoir\n' +
                    '• Salons de logs\n' +
                    '• Auto-rôle\n' +
                    '• Couleur personnalisée\n' +
                    '• Configuration de sécurité\n\n' +
                    `Pour confirmer, utilisez: \`${ConfigService.getPrefix(message.guild.id)}resetconfig confirm\``,
                    '🔄 Réinitialisation de la Configuration'
                );
                return message.reply({ embeds: [embed] });
            }

            ConfigService.resetGuildConfig(message.guild.id);
            
            const stmt = db.db.prepare('DELETE FROM automod_config WHERE guild_id = ?');
            stmt.run(message.guild.id);

            const stmt2 = db.db.prepare('DELETE FROM logs_config WHERE guild_id = ?');
            stmt2.run(message.guild.id);

            const embed = embeds.success(
                'La configuration de votre serveur a été réinitialisée avec succès.\n\n' +
                `Utilisez \`+setup\` pour reconfigurer votre bot rapidement.`,
                '✅ Configuration Réinitialisée'
            );

            await message.reply({ embeds: [embed] });
            client.logger.command(`RESETCONFIG by ${message.author.tag} in ${message.guild.id}`);
        } catch (err) {
            client.logger.error('Resetconfig command error: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors de la réinitialisation de la configuration.')] });
        }
    }
};

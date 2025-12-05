const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const AutomodService = require('../../services/AutomodService');

module.exports = {
    name: 'security-check',
    description: 'Analyse la configuration du serveur',
    category: 'security',
    aliases: ['securitycheck', 'seccheck'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 30,
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const config = AutomodService.getConfig(message.guild.id);
            const issues = [];
            const recommendations = [];

            if (!config.antispam) issues.push('❌ Anti-spam désactivé');
            if (!config.antilink) recommendations.push('💡 Activer anti-link pour plus de sécurité');
            if (!config.antijoinraid) issues.push('❌ Protection anti-raid désactivée');
            if (!config.antinuke) issues.push('⚠️ Anti-nuke désactivé (critique)');

            const adminRoles = message.guild.roles.cache.filter(r => r.permissions.has('Administrator'));
            if (adminRoles.size > 3) recommendations.push(`⚠️ ${adminRoles.size} rôles avec permissions admin (recommandé: max 2-3)`);

            const bots = message.guild.members.cache.filter(m => m.user.bot).size;
            if (bots > 10) recommendations.push(`⚠️ ${bots} bots sur le serveur (vérifier leur utilité)`);

            const embed = embeds.info('', '🔍 Analyse de Sécurité', {
                fields: [
                    { name: '🛡️ Modules actifs', value: `Anti-spam: ${config.antispam ? '✅' : '❌'}\nAnti-link: ${config.antilink ? '✅' : '❌'}\nAnti-raid: ${config.antijoinraid ? '✅' : '❌'}\nAnti-nuke: ${config.antinuke ? '✅' : '❌'}`, inline: false },
                    { name: '⚠️ Problèmes détectés', value: issues.length > 0 ? issues.join('\n') : '✅ Aucun problème majeur', inline: false },
                    { name: '💡 Recommandations', value: recommendations.length > 0 ? recommendations.join('\n') : '✅ Configuration optimale', inline: false }
                ]
            });

            return message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Security-check command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de l\'analyse de sécurité.')] });
        }
    }
};

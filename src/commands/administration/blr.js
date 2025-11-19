const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');
const ConfigService = require('../../services/ConfigService');

module.exports = {
    name: 'blr',
    description: 'Bloquer un membre pour qu\'il ne puisse pas recevoir de rôles',
    category: 'administration',
    aliases: ['blacklistrole', 'blockrole'],
    permissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 3,
    usage: '<@membre>',
    
    async execute(message, args, client) {
        try {
            const REQUIRED_ROLE = '1434622694481072130';
            const requiredRole = message.guild.roles.cache.get(REQUIRED_ROLE);
            
            if (!message.member.roles.cache.has(REQUIRED_ROLE) && 
                (!requiredRole || message.member.roles.highest.position <= requiredRole.position)) {
                return message.reply({ embeds: [embeds.error(`Cette commande est réservée à <@&${REQUIRED_ROLE}> ou supérieur.`)] });
            }

            const targetMember = message.mentions.members.first();
            if (!targetMember) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un membre.\nUsage: `+blr @membre`')] });
            }

            db.db.prepare(`CREATE TABLE IF NOT EXISTS role_blacklist (
                guild_id TEXT,
                user_id TEXT,
                moderator_id TEXT,
                created_at TEXT,
                PRIMARY KEY (guild_id, user_id)
            )`).run();

            const existing = db.db.prepare('SELECT * FROM role_blacklist WHERE guild_id = ? AND user_id = ?')
                .get(message.guild.id, targetMember.id);

            if (existing) {
                return message.reply({ embeds: [embeds.error(`${targetMember.user.tag} est déjà bloqué pour recevoir des rôles.`)] });
            }

            db.db.prepare('INSERT INTO role_blacklist (guild_id, user_id, moderator_id, created_at) VALUES (?,?,?,?)')
                .run(message.guild.id, targetMember.id, message.author.id, new Date().toISOString());

            const color = ConfigService.getEmbedColor(message.guild.id);
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🚫 Membre bloqué')
                .setDescription(`${targetMember} ne peut plus recevoir de rôles`)
                .addFields(
                    { name: '👤 Membre', value: targetMember.user.tag, inline: true },
                    { name: '👮 Par', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            client.logger.command(`BLR: ${targetMember.user.tag} by ${message.author.tag} in ${message.guild.id}`);

        } catch (err) {
            client.logger.error('Error in blr command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du blocage du membre.')] });
        }
    }
};

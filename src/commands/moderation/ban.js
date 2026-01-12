const { PermissionFlagsBits } = require('discord.js');
const { resolveMember } = require('../../utils/validators');
const PermissionHandler = require('../../utils/PermissionHandler');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'ban',
    description: 'Bannir un membre du serveur',
    category: 'moderation',
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 3,
    async execute(message, args, client) {
        try {
            // 1. Vérification du niveau de permission de l'exécuteur (via PermissionHandler ou rôles Discord)
            // Ici on garde la vérification Discord de base + le check de limite
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            // 2. Vérification du Rate Limit
            if (!PermissionHandler.checkRateLimit(message.member, 'ban')) {
                const remaining = PermissionHandler.getRemainingUses(message.member, 'ban');
                return message.reply({ embeds: [embeds.error(`Vous avez atteint votre limite de bannissements pour cette heure.\nRestant: ${remaining}`)] });
            }

            let targetUser = message.mentions.users.first();
            if (!targetUser && args[0]) {
                try {
                    // Si c'est un ID
                    targetUser = await client.users.fetch(args[0]);
                } catch (e) {
                    // ID invalide ou user introuvable
                }
            }

            if (!targetUser) return message.reply({ embeds: [embeds.error('Membre introuvable. Mentionnez-le ou utilisez son ID.')] });

            const target = await message.guild.members.fetch(targetUser.id).catch(() => null);

            // Cas specifique BAN : on peut bannir qqun qui n'est PAS sur le serveur (hackban)
            // Donc si target member est null, on peut quand meme bannir via l'objet user (si on veut)
            // Mais pour l'instant on garde la logique "resolveMember" classique ou on adapte pour hackban si besoin.
            // Le code original utilisait "resolveMember" qui checkait member.
            // Si on veut permettre le ban par ID d'un user hors serveur, il faut adapter plus de logique.
            // Pour l'instant on reste sur la logique "Membre du serveur". 

            if (!target) return message.reply({ embeds: [embeds.error('Ce membre n\'est pas sur le serveur (Pour bannir un user externe, utilisez massban ou une commande hackban).')] });

            // 3. Vérification de la Hiérarchie (Nouveau système)
            if (!PermissionHandler.checkHierarchy(message.member, target)) {
                return message.reply({ embeds: [embeds.error('Vous ne pouvez pas sanctionner ce membre car il est supérieur ou égal à vous dans la hiérarchie du bot.')] });
            }

            // 4. Vérification classique Discord (Bot vs Target)
            if (!target.bannable) {
                return message.reply({ embeds: [embeds.error('Je ne peux pas bannir ce membre (il est peut-être supérieur à moi ou propriétaire).')] });
            }

            const banReason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
            const auditReason = `[🛡️ UHQ MODERATION] ${banReason} — par ${message.author.tag}`;

            await target.ban({ reason: auditReason });

            // Log vers LogService
            if (client.logs) {
                await client.logs.logModeration(message.guild, 'BAN', {
                    user: target.user,
                    moderator: message.author,
                    reason: banReason
                });
            }

            const remaining = PermissionHandler.getRemainingUses(message.member, 'ban');
            await message.reply({
                embeds: [embeds.success(`${target.user.tag} a été banni.`, 'Action: Ban').addFields(
                    { name: 'Raison', value: banReason },
                    { name: 'Modérateur', value: message.author.tag },
                    { name: 'Quota restant', value: `${remaining}` }
                )]
            });

            client.logger.command(`BAN: ${target.user.tag} by ${message.author.tag} in ${message.guild.id} - ${banReason}`);
        } catch (err) {
            client.logger.error('Error in ban command: ' + err.stack);
            return message.reply({ embeds: [embeds.error('Erreur lors du bannissement.')] });
        }
    }
};

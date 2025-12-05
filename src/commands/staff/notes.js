const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/database');

module.exports = {
    name: 'notes',
    description: 'Gérer les notes internes d\'un membre',
    category: 'staff',
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 5,
    usage: '[add/view] [@user] [note]',
    
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(this.permissions || [])) {
                return message.reply({ embeds: [embeds.error('Permission insuffisante')] });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['add', 'view'].includes(action)) {
                return message.reply({ embeds: [embeds.error('Usage: `+notes add @user Note ici` ou `+notes view @user`')] });
            }

            const target = message.mentions.members.first();
            if (!target) {
                return message.reply({ embeds: [embeds.error('Veuillez mentionner un utilisateur.')] });
            }

            if (action === 'add') {
                const note = args.slice(2).join(' ');
                if (!note) {
                    return message.reply({ embeds: [embeds.error('Veuillez fournir une note.')] });
                }

                const stmt = db.db.prepare('INSERT INTO notes (guild_id, user_id, moderator_id, note, created_at) VALUES (?, ?, ?, ?, ?)');
                stmt.run(message.guild.id, target.id, message.author.id, note, new Date().toISOString());

                const embed = embeds.success(`Note ajoutée pour ${target.user.tag}`, '📝 Note');
                await message.reply({ embeds: [embed] });

                client.logger.command(`NOTE ADD: ${target.user.tag} by ${message.author.tag}`);
            } else if (action === 'view') {
                const stmt = db.db.prepare('SELECT * FROM notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 10');
                const notes = stmt.all(message.guild.id, target.id);

                if (notes.length === 0) {
                    return message.reply({ embeds: [embeds.error('Aucune note pour cet utilisateur.')] });
                }

                const notesList = notes.map((n, i) => {
                    const date = new Date(n.created_at).toLocaleString('fr-FR');
                    return `**${i + 1}.** ${n.note}\n*Par: <@${n.moderator_id}> le ${date}*`;
                }).join('\n\n');

                const embed = embeds.info('', `📝 Notes de ${target.user.tag}`, {
                    fields: [
                        { name: 'Notes', value: notesList, inline: false },
                        { name: 'Total', value: `${notes.length} note(s)`, inline: true }
                    ]
                });

                await message.reply({ embeds: [embed] });
            }
        } catch (err) {
            client.logger.error('Notes command error: ' + err.message);
            return message.reply({ embeds: [embeds.error('Erreur lors de la gestion des notes.')] });
        }
    }
};

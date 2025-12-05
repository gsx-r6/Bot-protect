const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setup-stats',
    description: 'Crée deux salons vocaux pour afficher les statistiques (membres/online & en vocal). Administrateurs uniquement.',
    category: 'administration',
    async execute(message, args, client) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
                return message.reply('Vous devez être administrateur pour exécuter cette commande.');

            // Create two voice channels with initial names
            const guild = message.guild;

            // Check manage channels permission for bot
            const botMember = await guild.members.fetch(client.user.id);
            if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply('Le bot n\'a pas la permission MANAGE_CHANNELS nécessaire pour créer/renommer des salons.');
            }

            const membersChannel = await guild.channels.create({
                name: `Membres: ${guild.memberCount} • Online: 0`,
                type: 2, // GUILD_VOICE
                reason: 'Stats channels created by Nami Protect setup-stats',
            });

            const voiceChannel = await guild.channels.create({
                name: `En vocal: 0`,
                type: 2,
                reason: 'Stats channels created by Nami Protect setup-stats',
            });

            // Reply with instructions and the created IDs
            await message.reply(
                `Salons créés : Membres/Online = ${membersChannel.id}, En vocal = ${voiceChannel.id}\n` +
                `Ajoute ces IDs dans ton fichier .env (STATS_VC_MEMBERS_ONLINE et STATS_VC_VOICE_COUNT) pour que Nami mette à jour automatiquement les noms.`
            );

        } catch (err) {
            client.logger.error('setup-stats error: ' + (err.stack || err.message));
            return message.reply('Impossible de créer les salons de statistiques.');
        }
    }
};

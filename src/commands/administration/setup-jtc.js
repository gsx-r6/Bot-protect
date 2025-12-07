const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/database'); // Faudra stocker l'ID du salon JTC en DB

// Comme on n'a pas encore de table 'jtc_config', on va créer un fichier de commande qui
// mettra en place le salon et expliquera à l'user qu'il doit configurer.
// Pour le MVP sans migration DB complexe maintenant, on va stocker l'ID en JSON ou juste le créer et le logguer.
// LE MIEUX : Utiliser db.db.prepare pour créer la table à la volée si elle n'existe pas (Lazy Init).

module.exports = {
    name: 'setup-jtc',
    description: 'Configurer le système Join-to-Create (Temp Voice)',
    category: 'administration',
    aliases: ['jtc-setup'],

    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Vous devez être administrateur.');
        }

        // Créer la catégorie et le salon
        const category = await message.guild.channels.create({
            name: '🔊 SALONS TEMPORAIRES',
            type: ChannelType.GuildCategory
        });

        const masterChannel = await message.guild.channels.create({
            name: '➕ Créer Vocal',
            type: ChannelType.GuildVoice,
            parent: category.id,
            userLimit: 1
        });

        // Sauvegarder en DB (On va faire une lazy creation de table ici si besoin, ou juste utiliser guild_config si colonne existe ?)
        // On va créer une petite table dédiée dans JTCService qu'on va implémenter.
        // Pour l'instant, on envoie juste l'info.

        // On va sauver ça dans un simple fichier JSON config temporaire ou alors... 
        // NON, on a database.js. Essayons d'ajouter une table proprement via le service.

        const JTCService = require('../../services/JTCService'); // Sera créé juste après
        JTCService.setMasterChannel(message.guild.id, masterChannel.id, category.id);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Join-to-Create Configuré')
            .setDescription(`Les salons temporaires seront créés dans la catégorie **${category.name}**.\n\nLe salon maître est : ${masterChannel}`)
            .setFooter({ text: 'Rejoignez le salon pour tester !' });

        message.reply({ embeds: [embed] });
    }
};

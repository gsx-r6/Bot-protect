const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/database');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'panic',
    description: '🔴 Système d\'URGENCE : Verrouille tout le serveur et active la protection maximale.',
    category: 'security',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 0,
    usage: '[off]',

    async execute(message, args, client) {
        const guild = message.guild;
        const everyoneRole = guild.roles.everyone;

        if (args[0] === 'off') {
            const loading = await message.reply({ embeds: [embeds.info('🟢 Fin de l\'état d\'urgence... Restauration des salons.')] });

            const backups = db.getPanicBackups(guild.id);
            if (backups.length === 0) {
                return loading.edit({ embeds: [embeds.error('Aucune sauvegarde de panic trouvée pour ce serveur.')] });
            }

            let restored = 0;
            const promises = backups.map(async (bk) => {
                const channel = guild.channels.cache.get(bk.channel_id);
                if (channel) {
                    try {
                        const perms = JSON.parse(bk.permissions);
                        await channel.permissionOverwrites.edit(everyoneRole, perms, { reason: 'Fin Panic Button' });
                        restored++;
                    } catch (e) {
                        client.logger.error(`[Panic Off] Erreur salon ${channel.name}: ${e.message}`);
                    }
                }
            });

            await Promise.all(promises);
            db.clearPanicBackups(guild.id);

            // Désactiver le mode Raid
            if (client.antiRaid) {
                await client.antiRaid.deactivateRaidMode(guild);
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🟢 État d\'Urgence Terminé')
                .setDescription(`Le serveur est revenu à la normale.`)
                .addFields({ name: '✅ Salons restaurés', value: `${restored}`, inline: true })
                .setTimestamp();

            return loading.edit({ embeds: [embed] });
        }

        // --- MODE PANIC ---
        const confirmMsg = await message.reply({
            embeds: [embeds.warning('🔴 **CONFIRMATION REQUISE**\n\nCette commande va TOUT verrouiller instantanément. Écrivez `confirm` pour confirmer.')]
        });

        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'confirm';
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async () => {
            const loading = await message.reply({ embeds: [embeds.info('🔴 **PANIC BUTTON ACTIVÉ** : Sécurisation en cours...')] });

            let locked = 0;
            const channels = guild.channels.cache.filter(c => c.isTextBased() || c.isVoiceBased());

            // 1. Sauvegarde et Verrouillage Parallèle
            const promises = channels.map(async (channel) => {
                try {
                    const currentOverwrites = channel.permissionOverwrites.cache.get(everyoneRole.id);
                    const permsToSave = {
                        SendMessages: currentOverwrites?.allow.has(PermissionFlagsBits.SendMessages) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.SendMessages) ? false : null),
                        AddReactions: currentOverwrites?.allow.has(PermissionFlagsBits.AddReactions) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.AddReactions) ? false : null),
                        Connect: currentOverwrites?.allow.has(PermissionFlagsBits.Connect) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.Connect) ? false : null),
                        Speak: currentOverwrites?.allow.has(PermissionFlagsBits.Speak) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.Speak) ? false : null),
                        CreatePublicThreads: currentOverwrites?.allow.has(PermissionFlagsBits.CreatePublicThreads) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.CreatePublicThreads) ? false : null),
                        CreatePrivateThreads: currentOverwrites?.allow.has(PermissionFlagsBits.CreatePrivateThreads) ? true : (currentOverwrites?.deny.has(PermissionFlagsBits.CreatePrivateThreads) ? false : null),
                    };

                    db.savePanicBackup(guild.id, channel.id, permsToSave);

                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Connect: false,
                        Speak: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false
                    }, { reason: 'PANIC BUTTON ACTIVÉ' });

                    locked++;
                } catch (e) {
                    client.logger.error(`[Panic] Erreur salon ${channel.name}: ${e.message}`);
                }
            });

            await Promise.all(promises);

            // 2. Activer AntiRaid Force
            if (client.antiRaid) {
                await client.antiRaid.forceRaidMode(guild);
            }

            // 3. Alerte Admins/Owner
            const owner = await guild.fetchOwner();
            const alertEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚨 ALERTE PANIC BUTTON')
                .setDescription(`Le Panic Button a été activé sur le serveur **${guild.name}** par **${message.author.tag}**.`)
                .addFields(
                    { name: '🔒 Statut', value: 'SERVEUR TOTALEMENT VERROUILLÉ', inline: false },
                    { name: '📊 Salons affectés', value: `${locked}`, inline: true }
                )
                .setTimestamp();

            owner.send({ embeds: [alertEmbed] }).catch(() => { });

            const finalEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔴 PANIC : SÉCURITÉ MAXIMALE')
                .setDescription('Tout le serveur a été verrouillé. Le mode Raid est activé.')
                .addFields(
                    { name: '✅ Salons verrouillés', value: `${locked}`, inline: true },
                    { name: '🔓 Pour rétablir', value: '`+panic off`', inline: true }
                )
                .setTimestamp();

            await loading.edit({ embeds: [finalEmbed] });
            client.logs.logSecurity(guild, 'PANIC_ACTIVATED', { moderator: message.author, channelCount: locked });
        });
    }
};

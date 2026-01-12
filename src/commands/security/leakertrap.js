const { PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../database/database');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'leakertrap',
    description: '💀 Configurer le salon "Bait" pour piéger les nukers/selfbots.',
    category: 'security',
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    usage: '<setup|status|disable>',

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();
        const guild = message.guild;

        if (sub === 'setup') {
            const config = db.getGuildConfig(guild.id);
            if (config?.leakertrap_channel_id) {
                const existing = guild.channels.cache.get(config.leakertrap_channel_id);
                if (existing) return message.reply({ embeds: [embeds.error('Leaker-Trap déjà configuré !')] });
            }

            const loading = await message.reply({ embeds: [embeds.info('⏳ Déploiement du Leaker-Trap...')] });

            try {
                // Créer le salon piège
                const trapChannel = await guild.channels.create({
                    name: '🔧-staff-only', // Nom trompeur pour attirer les bots de raid
                    type: ChannelType.GuildText,
                    topic: 'Salon de test pour les intégrations staff. NE PAS ECRIRE ICI.',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        }
                    ],
                    reason: 'UHQ Security: Deployment of Leaker-Trap'
                });

                db.setGuildConfig(guild.id, 'leakertrap_channel_id', trapChannel.id);

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('💀 Leaker-Trap Déployé')
                    .setDescription(`Le salon piège a été créé avec succès.`)
                    .addFields(
                        { name: '📍 Salon', value: `${trapChannel}`, inline: true },
                        { name: '🛠️ Fonctionnement', value: 'Tout membre (humain ou bot) qui envoie un message dans ce salon sera **banni instantanément**.', inline: false },
                        { name: '⚠️ Avertissement', value: 'Assurez-vous que personne de votre staff n\'écrive dedans par erreur.', inline: false }
                    )
                    .setTimestamp();

                await loading.edit({ embeds: [embed] });
                client.logs.logSecurity(guild, 'LEAKER_TRAP_SETUP', { moderator: message.author, channel: trapChannel });

            } catch (err) {
                client.logger.error(`[LeakerTrap Command] Error: ${err.message}`);
                return loading.edit({ embeds: [embeds.error('Erreur lors de la création du salon piège.')] });
            }
        }
        else if (sub === 'status') {
            const config = db.getGuildConfig(guild.id);
            const channelId = config?.leakertrap_channel_id;
            const channel = channelId ? guild.channels.cache.get(channelId) : null;

            const embed = new EmbedBuilder()
                .setColor(channel ? '#00FF00' : '#FF0000')
                .setTitle('💀 Statut Leaker-Trap')
                .addFields(
                    { name: 'État', value: channel ? '🟢 ACTIF' : '🔴 INACTIF', inline: true },
                    { name: 'Salon', value: channel ? `${channel}` : 'Aucun', inline: true }
                )
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }
        else if (sub === 'disable') {
            const config = db.getGuildConfig(guild.id);
            const channelId = config?.leakertrap_channel_id;

            if (!channelId) return message.reply({ embeds: [embeds.error('Le Leaker-Trap n\'est pas activé.')] });

            const channel = guild.channels.cache.get(channelId);
            if (channel) {
                await channel.delete('Leaker-Trap désactivé').catch(() => { });
            }

            db.setGuildConfig(guild.id, 'leakertrap_channel_id', null);

            message.reply({ embeds: [embeds.info('🔴 Leaker-Trap désactivé et salon supprimé.')] });
            client.logs.logSecurity(guild, 'LEAKER_TRAP_DISABLED', { moderator: message.author });
        }
        else {
            return message.reply({ embeds: [embeds.info(`Utilisation: \`${config.prefix || '+'}leakertrap <setup|status|disable>\``)] });
        }
    }
};

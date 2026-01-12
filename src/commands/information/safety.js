const { PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const db = require('../../database/database');
const embeds = require('../../utils/embeds');

module.exports = {
    name: 'safety',
    description: '📊 Affiche le bilan de sécurité du serveur (UHQ Visualization).',
    category: 'information',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    usage: '',

    async execute(message, args, client) {
        const guild = message.guild;
        const stats = db.getSecurityStats(guild.id);
        const config = db.getGuildConfig(guild.id);
        const automod = db.getAutomodConfig(guild.id);

        // Canvas Setup
        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // Background: Dark Gradient
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 450);

        // Border Glow
        ctx.strokeStyle = '#FF69B4'; // Nami Pink
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 790, 440);

        // Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText('Nami Security Dashboard', 50, 80);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(`Server: ${guild.name}`, 50, 115);

        // Stats Grid
        const drawStat = (x, y, label, value, color) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.roundRect(x, y, 320, 100, 15);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.font = 'bold 35px sans-serif';
            ctx.fillText(value, x + 20, y + 50);

            ctx.fillStyle = '#AAAAAA';
            ctx.font = '18px sans-serif';
            ctx.fillText(label, x + 20, y + 80);
        };

        // Row 1
        drawStat(50, 150, 'SANCTIONS TOTALES', (stats.bans + stats.kick).toString(), '#FF0000');
        drawStat(420, 150, 'AVERTISSEMENTS', stats.warnings.toString(), '#FFA500');

        // Row 2
        const ltStatus = config?.leakertrap_channel_id ? 'ACTIF' : 'INACTIF';
        drawStat(50, 275, 'LEAKER-TRAP', ltStatus, config?.leakertrap_channel_id ? '#00FF00' : '#FF0000');

        const raidStatus = stats.activeRaid ? 'EN ALERTE' : 'NORMAL';
        drawStat(420, 275, 'ÉTAT DU SEURVEUR', raidStatus, stats.activeRaid ? '#FF0000' : '#00FF00');

        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px sans-serif';
        ctx.fillText('UHQ Protection System • Nami Bot v3.1.0', 50, 415);
        ctx.fillText(new Date().toLocaleString('fr-FR'), 600, 415);

        // Final Attachment
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'safety-stats.png' });

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🛡️ Bilan de Sécurité')
            .setImage('attachment://safety-stats.png')
            .setTimestamp()
            .setFooter({ text: 'Rapport généré instantanément' });

        await message.reply({ embeds: [embed], files: [attachment] });
    }
};

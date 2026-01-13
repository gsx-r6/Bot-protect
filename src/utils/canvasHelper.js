const logger = require('./logger');
let GlobalFonts, createCanvas, loadImage;

try {
    const canvas = require('@napi-rs/canvas');
    GlobalFonts = canvas.GlobalFonts;
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
} catch (e) {
    logger.warn('Module @napi-rs/canvas manquant ou erreur de chargement. Le système de bienvenue utilisera le fallback Embed.');
}

module.exports = {
    /**
     * Génère une image de bienvenue UHQ
     * @param {GuildMember} member - Le membre qui a rejoint
     * @returns {Promise<Buffer>} - L'image générée en buffer
     */
    async generateWelcomeImage(member) {
        if (!createCanvas) return null;

        try {
            const width = 1024;
            const height = 450;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const username = member.user.username;
            const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const memberCount = member.guild.memberCount;

            // --- 1. FOND (BACKGROUND) ---
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0f0c29');
            gradient.addColorStop(0.5, '#302b63');
            gradient.addColorStop(1, '#24243e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(width, 0, 300, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, height, 200, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // --- 2. CADRE ---
            const margin = 20;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

            // --- 3. AVATAR ---
            const avatarSize = 250;
            const avatarX = width / 2;
            const avatarY = height / 2 - 50;

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 10, 0, Math.PI * 2);
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();

            try {
                const avatarImage = await loadImage(avatarUrl);
                ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            } catch (e) {
                ctx.fillStyle = '#7289da';
                ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            }
            ctx.restore();

            // --- 4. TEXTES ---
            ctx.textAlign = 'center';
            ctx.font = 'bold 60px "Arial"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.fillText('BIENVENUE', width / 2, height - 130);

            ctx.font = 'bold 45px "Arial"';
            ctx.fillStyle = '#00d2ff';
            ctx.fillText(username.toUpperCase(), width / 2, height - 70);

            ctx.font = 'bold 30px "Arial"';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`Membre #${memberCount}`, width / 2, height - 30);

            return canvas.toBuffer('image/png');
        } catch (err) {
            logger.error('Canvas Error:', err);
            return null;
        }
    },

    /**
     * Génère une jauge de TrustScore UHQ
     * @param {number} score - Le score (0-100)
     * @returns {Promise<Buffer>} - L'image générée
     */
    async generateTrustGauge(score) {
        if (!createCanvas) return null;

        try {
            const width = 600;
            const height = 150;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#1e1e2e';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(0, 0, width, height, 20);
            } else {
                ctx.rect(0, 0, width, height);
            }
            ctx.fill();

            const barX = 50;
            const barY = 60;
            const barWidth = 500;
            const barHeight = 30;

            ctx.fillStyle = '#313244';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(barX, barY, barWidth, barHeight, 15);
            } else {
                ctx.rect(barX, barY, barWidth, barHeight);
            }
            ctx.fill();

            let color1, color2;
            if (score < 20) { color1 = '#f38ba8'; color2 = '#eba0ac'; }
            else if (score < 50) { color1 = '#fab387'; color2 = '#f9e2af'; }
            else { color1 = '#a6e3a1'; color2 = '#94e2d5'; }

            const fillGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            fillGradient.addColorStop(0, color1);
            fillGradient.addColorStop(1, color2);

            const currentWidth = (score / 100) * barWidth;
            if (currentWidth > 0) {
                ctx.fillStyle = fillGradient;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(barX, barY, currentWidth, barHeight, 15);
                } else {
                    ctx.rect(barX, barY, currentWidth, barHeight);
                }
                ctx.fill();
            }

            ctx.fillStyle = '#cdd6f4';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Confiance :', barX, 45);

            ctx.textAlign = 'right';
            ctx.fillText(`${score}/100`, barX + barWidth, 45);

            let levelText = 'CRITIQUE';
            if (score >= 80) levelText = 'ELITE';
            else if (score >= 50) levelText = 'FIABLE';
            else if (score >= 30) levelText = 'SUSPECT';

            ctx.font = 'italic 20px Arial';
            ctx.fillStyle = color1;
            ctx.textAlign = 'center';
            ctx.fillText(levelText, width / 2, barY + barHeight + 35);

            return canvas.toBuffer('image/png');
        } catch (err) {
            logger.error('Trust Gauge Canvas Error:', err);
            return null;
        }
    }
};
